from locust import HttpLocust, TaskSet, task
import time, random
from random import randint
import string, math

class UserBehavior(TaskSet):
    def on_start(self):
        """ on_start is called when a Locust start before any task is scheduled """
        self.login()

    def login(l):
        timestamp = str(int(math.floor(time.time() + randint(0, 10))))
        message = ''.join(random.sample(string.letters, 15))
        l.client.post("/add-entry", {"timestamp":timestamp, "message":message})
    
""" @task(1)
    def index(l):
        l.client.get("/chat");"""

class ChatroomUser(HttpLocust):
    task_set = UserBehavior
    min_wait = 5000
    max_wait = 9000
