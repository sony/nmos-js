# Copyright (C) 2021 Advanced Media Workflow Association
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json


class DataStore:
    """
    Store json with test question details for use with NMOS Controller
    test suite and Testing Facade
    """

    def __init__(self):
        self.test_type = None
        self.question_id = None
        self.name = None
        self.description = None
        self.question = None
        self.answers = None
        self.time_sent = None
        self.timeout = None
        self.answer_uri = None
        self.answer_response = None
        self.status = "Empty"
        self.metadata = None

    def clear(self):
        self.test_type = None
        self.question_id = None
        self.name = None
        self.description = None
        self.question = None
        self.answers = None
        self.time_sent = None
        self.timeout = None
        self.answer_uri = None
        self.answer_response = None
        self.status = "Empty"
        self.metadata = None

    def getStatus(self):
        return self.status

    def setJson(self, json):
        self.status = "Test"
        self.test_type = json["test_type"]
        self.question_id = json["question_id"]
        self.name = json["name"]
        self.description = json["description"]
        self.question = json["question"]
        self.answers = json["answers"]
        self.time_sent = json["time_sent"]
        self.timeout = json['timeout']
        self.answer_uri = json["answer_uri"]
        self.metadata = json["metadata"]

    def getJson(self):
        json_data = {
            "test_type": self.test_type,
            "question_id": self.question_id,
            "name": self.name,
            "description": self.description,
            "question": self.question,
            "answers": self.answers,
            "time_sent": self.time_sent,
            "timeout": self.timeout,
            "answer_uri": self.answer_uri,
            "metadata": self.metadata
        }
        return json.dumps(json_data)

    def getAnswerJson(self):
        json_data = {
            "question_id": self.question_id,
            "answer_response": self.answer_response
        }
        return json.dumps(json_data)

    def setAnswer(self, answer):
        self.answer_response = answer

    def getQuestionID(self):
        return self.question_id

    def getAnswers(self):
        return self.answers

    def getUrl(self):
        return self.answer_uri

    def getMetadata(self):
        return self.metadata


data = DataStore()