"""Reproduz somente explain de consultas de leitura; não altera documentos ou índices."""
import argparse, copy, json, math, statistics, time
from pathlib import Path
from bson import json_util
from pymongo import MongoClient

def environment(path):
    data = {}
    for line in Path(path).read_text(encoding='utf-8-sig').splitlines():
        if '=' in line and not line.lstrip().startswith('#'):
            key, value = line.split('=', 1)
            data[key.strip()] = value.strip().strip('"').strip("'")
    return data

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--env-file', required=True)
    args = parser.parse_args()
    env = environment(args.env_file)
    client = MongoClient(env['MONGODB_URI'], serverSelectionTimeoutMS=15000,
                         socketTimeoutMS=30000, appname='astro-mongo-index-replay')
    try:
        db = client[env['MONGODB_DATABASE']]
        workloads = json.loads(Path(__file__).with_name('scenarios.json').read_text(encoding='utf-8'))
        group = list(db.mensagens.aggregate([{'$group': {'_id': '$conversa_id', 'count': {'$sum': 1}}}, {'$sort': {'count': -1, '_id': 1}}, {'$limit': 1}]))
        if not group:
            raise ValueError('A reprodução exige mensagens reais e não cria fixtures no banco.')
        conversation = group[0]['_id']
        messages = list(db.mensagens.find({'conversa_id': conversation}, {'_id': 1, 'data': 1, 'remetente_id': 1}).sort([('data', -1), ('_id', -1)]).limit(11))
        if len(messages) < 11:
            raise ValueError('A reprodução do cursor exige pelo menos 11 mensagens na conversa amostrada.')
        owner = next(db.sessoes.aggregate([{'$group': {'_id': '$usuario_id', 'n': {'$sum': 1}}}, {'$sort': {'n': -1}}, {'$limit': 1}]))['_id']
        session = db.sessoes.find_one({'usuario_id': owner}, {'_id': 1})['_id']
        summary = db.sessoes.find_one({'resumo': {'$type': 'string', '$ne': ''}}, {'usuario_id': 1})
        replacements = {'<CONVERSATION>': conversation, '<CURSORID>': messages[-1]['_id'],
                        '<SESSIONUID>': owner, '<SUMMARYUID>': summary['usuario_id'] if summary else owner,
                        '<SESSIONID>': session}
        def bind(value):
            if isinstance(value, dict):
                return {key: bind(item) for key, item in value.items()}
            if isinstance(value, list):
                return [bind(item) for item in value]
            if isinstance(value, str) and value in replacements:
                return replacements[value]
            if isinstance(value, str) and value.startswith('<') and value.endswith('>'):
                raise ValueError('Parâmetro não resolvido no cenário; confira os tipos do banco atual.')
            return value
        report = []
        for workload in workloads:
            command = copy.deepcopy(workload['command'])
            if workload['id'] == 'java_chat_por_id':
                command['filter']['_id'] = messages[0]['_id']
            if workload['id'] == 'java_chat_ultima_por_conversa':
                command['pipeline'][0]['$match']['conversa_id']['$in'] = [doc['_id'] for doc in db.conversas.find({'participantes_ids': messages[0]['remetente_id']}, {'_id': 1})]
            command = json_util.loads(json.dumps(bind(command)))
            if not ('find' in command or 'aggregate' in command):
                raise ValueError('Somente find e aggregate são permitidos.')
            if any('$out' in stage or '$merge' in stage for stage in command.get('pipeline', [])):
                raise ValueError('Pipeline de escrita não permitido.')
            request = {'explain': command, 'verbosity': 'executionStats', 'maxTimeMS': 15000}
            for _ in range(2):
                db.command(request)
            samples, roundtrips, counts = [], [], None
            for _ in range(11):
                start = time.perf_counter_ns()
                result = db.command(request)
                roundtrips.append((time.perf_counter_ns() - start) / 1e6)
                stats = result.get('executionStats')
                if stats is None:
                    stats = next(stage['$cursor']['executionStats'] for stage in result['stages'] if '$cursor' in stage)
                samples.append(stats['executionTimeMillis'])
                counts = {key: stats[key] for key in ['nReturned', 'totalDocsExamined', 'totalKeysExamined']}
            report.append({'id': workload['id'], **counts, 'medianServerMs': statistics.median(samples),
                           'p95ServerMs': sorted(samples)[math.ceil(.95 * len(samples)) - 1],
                           'medianRoundtripMs': round(statistics.median(roundtrips), 3), 'samplesServerMs': samples})
        print(json.dumps(report, indent=2))
    finally:
        client.close()

if __name__ == '__main__':
    main()
