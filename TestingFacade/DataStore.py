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
        self.timeout = None
        self.answer_uri = None
        self.answer_response = None
        self.metadata = None

    def clear(self):
        self.test_type = None
        self.question_id = None
        self.name = None
        self.description = None
        self.question = None
        self.answers = None
        self.timeout = None
        self.answer_uri = None
        self.answer_response = None
        self.metadata = None

    def setJson(self, json):
        self.test_type = json["test_type"]
        self.question_id = json["question_id"]
        self.name = json["name"]
        self.description = json["description"]
        self.question = json["question"]
        self.answers = json["answers"]
        self.timeout = json['timeout']
        self.answer_uri = json["answer_uri"]
        self.metadata = json["metadata"]

    def getAnswerJson(self):
        json_data = {
            "question_id": self.question_id,
            "answer_response": self.answer_response
        }
        return json_data

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


dataStore = DataStore()
