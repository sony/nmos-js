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

import os
import requests
import signal
import sys
from threading import Thread
from flask import Flask, request
from selenium.common.exceptions import NoSuchElementException
from DataStore import dataStore
from IS0404AutoTest import IS0404tests
from IS0503AutoTest import IS0503tests
import Config as CONFIG

TEST_SETS = {'IS-04-04': IS0404tests,
             'IS-05-03': IS0503tests}

app = Flask(__name__)

@app.route('/x-nmos/testquestion/<version>', methods=['POST'], strict_slashes=False)
def controller_tests_post(version):
    # Should be json from Test Suite with questions
    expected_entries = ['test_type', 'name', 'description', 'question', 'answers', 'answer_uri']

    if request.json.get('clear'):
        # End of current tests, clear data store
        dataStore.clear()
    else:
        # Should be a new question
        for entry in expected_entries:
            if entry not in request.json:
                return 'Invalid JSON received', 400
        # All required entries are present so update data
        dataStore.setJson(request.json)
        # Run test in new thread
        executionThread = Thread(target=execute_test)
        executionThread.start()
    return '', 202


def execute_test():
    """
    After test data has been sent to x-nmos/testing-facade figure out which
    test was sent. Call relevant test method and retrieve answers.
    Update json and send back to test suite
    """
    # Get question details from data store
    question_id = dataStore.getQuestionID()
    answers = dataStore.getAnswers()
    metadata = dataStore.getMetadata()

    # Load specified test suite
    tests = TEST_SUITE

    if question_id.startswith("test_"):
        # Get method associated with question id, set up test browser,
        # run method then tear down and save any answers returned to data store
        method = getattr(tests, question_id)
        if callable(method):
            print(" * Running " + question_id)
            try:
                tests.set_up_test()
                test_result = method(answers, metadata)
            except NoSuchElementException:
                test_result = None
            tests.tear_down_test()
            dataStore.setAnswer(test_result)

    elif question_id == 'pre_tests_message':
        # Beginning of test set, return to confirm start
        dataStore.setAnswer(None)

    elif question_id == 'post_tests_message':
        # End of test set, return to confirm end
        dataStore.setAnswer(None)

    else:
        # Not a recognised part of test suite
        dataStore.setAnswer(None)

    # POST answer json back to test suite
    requests.post(dataStore.getUrl(), json=dataStore.getAnswerJson())
    if question_id == 'post_tests_message':
        os.kill(os.getpid(), signal.SIGINT)
    return


if __name__ == "__main__":
    global TEST_SUITE

    if '--suite' not in sys.argv:
        sys.exit('You must specify a test suite with --suite')

    for i, arg in enumerate(sys.argv):
        if arg == '--suite':
            try:
                TEST_SUITE = TEST_SETS[sys.argv[i+1]]
            except Exception as e:
                sys.exit('Invalid test suite selection ' + str(e))

    app.run(host='0.0.0.0', port=CONFIG.TESTING_FACADE_PORT)
