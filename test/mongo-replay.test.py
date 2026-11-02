import datetime
import json
import runpy
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
bind_chat_cursor = runpy.run_path(str(ROOT / 'mongo/analysis/performance/replay.py'))['bind_chat_cursor']


class ChatCursorTest(unittest.TestCase):
    def test_cursor_uses_date_and_id_from_tenth_message(self):
        scenarios = json.loads((ROOT / 'mongo/analysis/performance/scenarios.json').read_text(encoding='utf-8'))
        command = next(item['command'] for item in scenarios if item['id'] == 'java_chat_cursor')
        original = json.dumps(command)
        messages = [{'_id': str(i), 'data': datetime.datetime(2030, 1, 1) - datetime.timedelta(seconds=i)} for i in range(11)]
        result = bind_chat_cursor(command, messages)
        cursor = messages[9]
        conditions = result['filter']['$and'][1]['$or']
        self.assertEqual(conditions, [
            {'data': {'$lt': cursor['data']}},
            {'data': cursor['data'], '_id': {'$lt': cursor['_id']}}
        ])
        self.assertNotEqual(cursor, messages[10])
        self.assertEqual(result['limit'], 10)
        self.assertEqual(json.dumps(command), original)


if __name__ == '__main__':
    unittest.main()
