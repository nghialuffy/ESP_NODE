import pandas as pd
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pickle
data = pd.read_csv('C:/Users/Admin/Desktop/DemoML/data.csv')
X = data.drop(columns = ['TimeStamp'])
X = X.drop(columns = ['Servo'])
print(X)
y = data['Servo']
print(y)
X_train, X_test, y_train, y_test = train_test_split(X,y,test_size=0.1)

model = DecisionTreeClassifier()
model.fit(X_train, y_train)
predictions = model.predict(X_test)

score = accuracy_score(y_test, predictions)
print(score)

pickle.dump(model, open('model.pkl','wb'))
model.pickle.load(open('model.pkl', 'rb'))
model = pickle.load(open('model.pkl', 'rb'))
print(model.predict([[32, 320, 34, 4500]]))