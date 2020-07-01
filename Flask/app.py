import pickle
from flask import Flask, request, jsonify
from flask_restful import Resource, Api
from datetime import datetime
from Controller.homepage import HomePage
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pandas as pd
from csv import writer


app = Flask(__name__)
api = Api(app)
api.add_resource(HomePage, '/')
def trainModel():
    data = pd.read_csv('./DataSet/data.csv')
    X = data.drop(columns = ['TimeStamp'])
    X = X.drop(columns = ['Servo'])
    Y = data['Servo']
    X_train, X_test, Y_train, Y_test = train_test_split(X,Y,test_size=0.1)
    model = DecisionTreeClassifier()
    model.fit(X_train, Y_train)
    predictions = model.predict(X_test)
    score = accuracy_score(Y_test, predictions)
    pickle.dump(model, open('./DataSet/model.pkl','wb'))
    
if __name__ == '__main__':
    try:
        trainModel()
        # app.debug = True
        app.run(host='0.0.0.0', port=9999)
    except Exception as e:
        print('Error: ', e)