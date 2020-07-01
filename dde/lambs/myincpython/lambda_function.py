import json

def lambda_handler(event, context):
    res = {
      'num': event['num'] + 1
    }
    print("ayyy from pyhton lambda")

    return res
