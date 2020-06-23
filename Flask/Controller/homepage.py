from flask_restful import Resource
from flask import request
import json

class HomePage(Resource):
    def post(self):
        try:
            json = request.json
            inside_temp = json["insidetemp"]
            inside_lux = json["insidelux"]
            outside_temp = json["outsidetemp"]
            outside_lux = json["outsidelux"]

            
            return request.json.get('data')
        except Exception as e:
            meserr = f"Error {e}"
            return meserr