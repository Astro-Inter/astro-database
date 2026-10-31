import importlib.util
from pathlib import Path
import unittest

path = Path(__file__).with_name('padronizar_documentos.py')
spec = importlib.util.spec_from_file_location('migration',path)
migration = importlib.util.module_from_spec(spec)
spec.loader.exec_module(migration)

class MigrationTest(unittest.TestCase):
    def test_form_preserves_responses_ids_and_decodes_appearance(self):
        original={'_id':'uuid','id_workspace':1,'id_gestor':2,'nr':6,'titulo':'Inspeção [ac1:f:1:6]', 'perguntas':[{'id_pergunta':1,'resposta':[{'id_imagem':'imagem','chave_objeto':'privada'}]}]}
        result=migration.transform(original,'formularios')
        self.assertEqual(result['titulo'],'Inspeção')
        self.assertEqual(result['configuracao'],{'icone':'calendar','cor':'orange'})
        self.assertEqual(result['nr_id'],6)
        self.assertEqual(result['perguntas'][0]['resposta'],[{'imagem_id':'imagem','chave_objeto':'privada'}])
        self.assertEqual(original['titulo'],'Inspeção [ac1:f:1:6]')
        self.assertEqual(migration.transform(result,'formularios'),result)

    def test_conflicts_and_unknown_markers_are_not_discarded(self):
        for document in [{'id_usuario':1,'usuario_id':2},{'title':'Antigo','titulo':'Novo'}]:
            with self.assertRaises(ValueError): migration.transform(document,'notificacoes')
        for title in ['Inspeção [ac2:f:1:1]','Inspeção [ac1:f:99:3]']:
            with self.assertRaises(ValueError): migration.transform({'titulo':title},'formularios')

    def test_messages_keep_structured_blocks_and_types(self):
        from datetime import datetime,timezone
        now=datetime.now(timezone.utc)
        document={'id_user':'uid','iniciada_em':now,'mensagens':[{'role':'assistant','content':'Oi','blocos':[{'tipo':'texto','conteudo':'Bloco'}]}],'acao_pendente':{'id_mensagem':'m','id_envia':1}}
        result=migration.transform(document,'sessoes')
        self.assertEqual(result['usuario_id'],'uid')
        self.assertIsInstance(result['iniciada_em'],datetime)
        self.assertEqual(result['mensagens'][0],{'papel':'assistant','conteudo':'Oi','blocos':[{'tipo':'texto','conteudo':'Bloco'}]})
        self.assertEqual(result['acao_pendente'],{'mensagem_id':'m','remetente_id':1})
        self.assertEqual(migration.transform(result,'sessoes'),result)

    def test_embedded_resource_reference_and_pending_action_follow_suffix(self):
        result=migration.transform({'recurso':{'id':42,'tipo':'evento'}},'notificacoes')
        self.assertEqual(result,{'recurso':{'recurso_id':42,'tipo':'evento'}})
        result=migration.transform({'acao_pendente':{'session_id':'s','id_evento':'e'}},'sessoes')
        self.assertEqual(result['acao_pendente'],{'sessao_id':'s','evento_id':'e'})

    def test_index_paths_are_translated_and_options_preserved(self):
        result=migration.translate({'partialFilterExpression':{'id_usuario':{'$type':'number'}},'expireAfterSeconds':0},'notificacoes')
        self.assertEqual(result,{'partialFilterExpression':{'usuario_id':{'$type':'number'}},'expireAfterSeconds':0})

if __name__=='__main__': unittest.main()
