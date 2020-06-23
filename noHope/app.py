import pickle

model = pickle.load(open('model.pkl', 'rb'))
print(model.predict([[43, 150, 49, 54000]]))