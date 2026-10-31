"""Planeja e aplica a padronização Mongo com cópia BSON e escritores interrompidos."""
import argparse
import copy
import json
import re
from pathlib import Path

COLLECTIONS = {
    'forms': 'formularios',
    'nr_catalog_sql_sync': 'sincronizacoes_catalogo_nrs',
    'chat_push_outbox': 'fila_entregas_chat',
}
COMMON = {
    'id_workspace': 'workspace_id', 'id_gestor': 'gestor_id',
    'id_gestor_remetente': 'gestor_remetente_id', 'id_gestor_revisor': 'gestor_revisor_id',
    'id_unidade': 'unidade_id', 'id_envio': 'envio_id',
    'id_pergunta': 'pergunta_id', 'id_opcao': 'opcao_id', 'id_imagem': 'imagem_id',
    'id_usuario': 'usuario_id', 'id_user': 'usuario_id',
    'id_conversa': 'conversa_id', 'id_remetente': 'remetente_id',
    'id_envia': 'remetente_id', 'id_recebe': 'destinatario_id',
    'id_mensagem': 'mensagem_id', 'id_evento': 'evento_id', 'event_id': 'evento_id',
    'session_id': 'sessao_id', 'participantes': 'participantes_ids',
}
SESSION = {'role': 'papel', 'content': 'conteudo', 'lock_token': 'reserva_token', 'lock_ate': 'reserva_ate'}
QUEUE = {'payload': 'evento', 'lease': 'reserva_token', 'version': 'versao', 'messageId': 'mensagem_id', 'conversationId': 'conversa_id', 'senderId': 'remetente_id', 'recipientId': 'destinatario_id', 'workspaceId': 'workspace_id', 'recipientUid': 'destinatario_uid', 'senderName': 'nome_remetente', 'preview': 'previa', 'createdAt': 'criado_em', 'done': 'concluida', 'expiresAt': 'expira_em', 'nextAttempt': 'proxima_tentativa_em', 'attempts': 'tentativas'}
ICONS = ['document', 'calendar', 'feedback', 'person-outline', 'security', 'check', 'building', 'collaborators', 'position', 'clock']
COLORS = ['purple', 'pink', 'blue', 'green', 'teal', 'indigo', 'orange', 'rose', 'violet', 'slate']
MARKER = re.compile(r'\s*\[ac(\d+):f:([^\]\r\n]{0,80})\]\s*$')

def field_name(name, collection):
    result = COMMON.get(name, name)
    if collection == 'formularios' and name == 'nr': result = 'nr_id'
    if collection == 'notificacoes' and name == 'title': result = 'titulo'
    if collection == 'sessoes':
        result = {key: value for key, value in SESSION.items() if key not in {'role', 'content'}}.get(name, result)
        result = result.replace('resumo_job_', 'resumo_tarefa_')
    if collection == 'fila_entregas_chat': result = QUEUE.get(name, result)
    if collection == 'sincronizacoes_catalogo_nrs': result = {'nrId': 'nr_id', 'createdAt': 'criado_em'}.get(name, result)
    return result

def translate(value, collection):
    if isinstance(value, list): return [translate(item, collection) for item in value]
    if not isinstance(value, dict): return value
    result = {}
    for name, item in value.items():
        target = '.'.join(field_name(part, collection) for part in name.split('.'))
        item = translate(item, collection)
        if target in result and result[target] != item:
            raise ValueError(f'Campos conflitantes: {target}; nenhum valor foi descartado.')
        result[target] = item
    return result

def translate_message(message):
    if not isinstance(message, dict): return message
    result = {}
    for key, value in message.items():
        target = {'role': 'papel', 'content': 'conteudo'}.get(key, key)
        if target in result and result[target] != value: raise ValueError('Mensagem com campos conflitantes.')
        result[target] = value
    return result

def transform(document, collection):
    result = translate(copy.deepcopy(document), collection)
    if collection == 'notificacoes' and isinstance(result.get('recurso'), dict):
        resource = result['recurso']
        if 'id' in resource:
            if 'recurso_id' in resource and resource['recurso_id'] != resource['id']:
                raise ValueError('Referências de recurso conflitantes.')
            resource['recurso_id'] = resource.pop('id')
    if collection == 'sessoes':
        result['mensagens'] = [translate_message(message) for message in result.get('mensagens', [])]
    if collection != 'formularios' or not isinstance(result.get('titulo'), str): return result
    title = result['titulo']
    appearance = None
    while match := MARKER.search(title):
        code = re.fullmatch(r'([0-9]):([0-9])', match[2])
        if match[1] != '1' or code is None:
            raise ValueError('Marcador de aparência desconhecido; revisar antes da migração.')
        decoded = {'icone': ICONS[int(code[1])], 'cor': COLORS[int(code[2])]}
        if appearance is None: appearance = decoded
        title = title[:match.start()].rstrip()
    if appearance:
        config = result.get('configuracao') or {}
        if not isinstance(config, dict): raise ValueError('Configuração existente inválida.')
        for field, value in appearance.items():
            if field in config and config[field] != value:
                raise ValueError('Aparência do marcador diverge da configuração; revisar manualmente.')
        result['configuracao'] = {**config, **appearance}
        result['titulo'] = title
    return result

def env_values(path):
    result = {}
    for line in Path(path).read_text(encoding='utf-8-sig').splitlines():
        if line.strip() and not line.lstrip().startswith('#') and '=' in line:
            key, value = line.split('=', 1)
            result[key.strip()] = value.strip().strip('"').strip("'")
    return result

def run():
    from pymongo import MongoClient
    from bson import json_util
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--env-file', required=True)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--writers-stopped', action='store_true')
    parser.add_argument('--backup-dir')
    args = parser.parse_args()
    if args.apply and (not args.writers_stopped or not args.backup_dir):
        parser.error('--apply exige --writers-stopped e --backup-dir vazio.')
    config = env_values(args.env_file)
    client = MongoClient(config['MONGODB_URI'], serverSelectionTimeoutMS=15000, w='majority')
    database = client[config['MONGODB_DATABASE']]
    selected = []
    for spec in database.list_collections():
        if spec.get('options', {}).get('validator'):
            raise ValueError('Coleção com validator: revisar o validator antes de migrar.')
    report = []
    names = set(database.list_collection_names())
    for source in sorted(names):
        target = COLLECTIONS.get(source, source)
        if source != target and target in names:
            raise ValueError(f'Coleções {source} e {target} coexistem; mesclagem automática recusada.')
        if target not in {'configuracoes_paineis','formularios','conversas','mensagens','notificacoes','sessoes','nrs','nrs_pendentes','fila_entregas_chat','sincronizacoes_catalogo_nrs'}:
            raise ValueError(f'Coleção sem mapeamento revisado: {source}.')
        changed = 0
        count = 0
        for document in database[source].find({}):
            count += 1
            changed += transform(document, target) != document
        indexes = list(database[source].list_indexes())
        report.append({'colecao_atual':source,'colecao_destino':target,'documentos':count,'documentos_alterados':changed,'indices':len(indexes)})
        selected.append((source, target, indexes))
    print(json.dumps({'modo':'aplicar' if args.apply else 'simulacao','colecoes':report}, ensure_ascii=False))
    if not args.apply:
        client.close()
        return
    backup = Path(args.backup_dir).resolve()
    backup.mkdir(parents=True, exist_ok=True)
    if any(backup.iterdir()): raise ValueError('O diretório de backup precisa estar vazio.')
    # Todas as cópias terminam antes de qualquer alteração no banco.
    for source, _, indexes in selected:
        with (backup/f'{source}.jsonl').open('w',encoding='utf-8') as output:
            for document in database[source].find({}): output.write(json_util.dumps(document)+'\n')
        (backup/f'{source}.indices.json').write_text(json_util.dumps(indexes),encoding='utf-8')
    (backup/'manifesto.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    for source, target, indexes in selected:
        collection = database[source]
        if source != target:
            collection.rename(target, dropTarget=False)
            collection = database[target]
        for document in collection.find({}):
            updated = transform(document, target)
            if updated != document:
                result = collection.replace_one({'_id':document['_id']}, updated)
                if result.matched_count != 1: raise ValueError('Documento desapareceu durante a migração.')
        for spec in indexes:
            if spec['name']=='_id_': continue
            keys = [( '.'.join(field_name(part,target) for part in key.split('.')), direction) for key,direction in spec['key'].items()]
            options = {key:value for key,value in spec.items() if key not in {'key','name','v','ns'}}
            normalized = translate(options,target)
            if keys == list(spec['key'].items()) and normalized == options: continue
            old_default = '_'.join(f'{key}_{direction}' for key, direction in spec['key'].items())
            new_default = '_'.join(f'{key}_{direction}' for key, direction in keys)
            final_name = new_default if spec['name'] == old_default else spec['name']
            if final_name != spec['name']:
                collection.create_index(keys, name=final_name, **normalized)
                collection.drop_index(spec['name'])
            else:
                collection.drop_index(spec['name'])
                try:
                    collection.create_index(keys, name=final_name, **normalized)
                except Exception:
                    collection.create_index(list(spec['key'].items()), name=spec['name'], **options)
                    raise
    client.close()
    print('Migração concluída. Cópias BSON estendidas preservadas no diretório informado.')

if __name__=='__main__': run()
