import pickle
from flask import Flask, request, jsonify
from flask_restful import Resource, Api
from datetime import datetime
from Controller.homepage import HomePage



app = Flask(__name__)
api = Api(app)
api.add_resource(HomePage, '/')

if __name__ == '__main__':
    try:
        # app.debug = True
        app.run(host='0.0.0.0', port=9999)
    except Exception as e:
        print('Error: ', e)