import json
import time
import math
import random

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}

_LAST = {}


def _simulated():
    points = 256
    peaks = [(0.18, 0.72, 0.012), (0.34, 0.55, 0.02), (0.52, 0.92, 0.008), (0.81, 0.63, 0.015)]
    levels = []
    drift = (time.time() % 12) / 250
    for i in range(points):
        x = i / points
        v = 0.08 + math.sin(i * 0.7) * 0.015 + random.random() * 0.04
        for pos, amp, width in peaks:
            v += amp * math.exp(-((x - pos + drift) / width) ** 2)
        levels.append(round(min(v, 1.0) * -100, 2))
    return {
        'device': 'SPECTRA-X',
        'start_freq': 900.0,
        'span': 2100.0,
        'unit': 'dBm',
        'levels': levels,
        'created_at': time.strftime('%Y-%m-%dT%H:%M:%S'),
        'source': 'simulation',
    }


def handler(event: dict, context) -> dict:
    """Приём данных спектра от программы-моста (USB) и выдача последнего замера в приложение."""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        _LAST['data'] = {
            'device': str(body.get('device', 'SPECTRA-X'))[:64],
            'start_freq': float(body.get('start_freq', 900)),
            'span': float(body.get('span', 2100)),
            'unit': str(body.get('unit', 'dBm'))[:16],
            'levels': body.get('levels', []),
            'created_at': time.strftime('%Y-%m-%dT%H:%M:%S'),
            'source': 'device',
        }
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': json.dumps({'ok': True, 'points': len(_LAST['data']['levels'])}),
        }

    data = _LAST.get('data') or _simulated()
    return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': json.dumps(data)}