from flask_restful import Resource
from flask import request
import json
import pickle
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pandas as pd
from csv import writer
class HomePage(Resource):
    def post(self):
        try:
            datajson = request.json
            time_stamp = datajson["timeStamp"]
            inside_temp = float(datajson["insideTemp"])
            inside_lux = float(datajson["insideLux"])
            outside_temp = float(datajson["outsideTemp"])
            outside_lux = float(datajson["outsideLux"])
            is_manual = int(datajson["ismanual"])

            model = pickle.load(open('./DataSet/model.pkl', 'rb'))
            servoDegree = model.predict([[inside_temp, inside_lux, outside_temp, outside_lux]])
            print(servoDegree)
            servoDegree = int(servoDegree[0])

            if(is_manual == 1):
                record = [time_stamp,inside_temp,inside_lux,outside_temp,outside_lux,servoDegree]

                with open('./DataSet/data.csv', 'a+', newline='') as write_obj:
                    csv_writer = writer(write_obj)
                    csv_writer.writerow(record)

                data = pd.read_csv('./DataSet/data.csv')
                X = data.drop(columns = ['TimeStamp'])
                X = X.drop(columns = ['Servo'])
                # print(X)
                Y = data['Servo']
                # print(y)
                X_train, X_test, Y_train, Y_test = train_test_split(X,Y,test_size=0.1)
                model = DecisionTreeClassifier()
                model.fit(X_train, Y_train)
                predictions = model.predict(X_test)
                score = accuracy_score(Y_test, predictions)
                # print(score)
                pickle.dump(model, open('./DataSet/model.pkl','wb'))


            response = {
                "servoDegree" : servoDegree
            }
            return response
        except Exception as e:
            meserr = f"Error {e}"
            return meserr