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

import requests
import json
import sys
from threading import Thread
from flask import Flask, request, Response
from DataStore import data
from IS0404AutoTest import IS0404tests
from IS0503AutoTest import IS0503tests

TEST_SETS = {'IS0404': IS0404tests,
             'IS0503': IS0503tests}

app = Flask(__name__)


@app.route('/x-nmos/testquestion/<version>', methods=['POST'], strict_slashes=False)
def controller_tests_post(version):
    # Should be json from Test Suite with questions
    json_list = ['test_type', 'name', 'description', 'question', 'answers', 'answer_uri']

    if 'clear' in request.json and request.json['clear'] == 'True':
        # End of current tests, clear data store
        data.clear()
    else:
        # Should be a new question
        for entry in json_list:
            if entry not in request.json:
                return False, "Missing {}".format(entry)
        # All required entries are present so update data
        data.setJson(request.json)
        # Run test in new thread
        thread = Thread(target=execute_test)
        thread.start()
    return '', 202


@app.route('/controller_questions/', methods=['GET'], strict_slashes=False)
def controller_tests_get():
    return Response(data.getJson(), mimetype='application/json')


def do_request(method, url, **kwargs):
    """Perform a basic HTTP request with appropriate error handling"""
    try:
        s = requests.Session()
        # The only place we add headers is auto OPTIONS for CORS, which
        # should not check Auth
        if "headers" in kwargs and kwargs["headers"] is None:
            del kwargs["headers"]

        req = requests.Request(method, url, **kwargs)
        prepped = s.prepare_request(req)
        settings = s.merge_environment_settings(prepped.url, {}, None, None, None)
        response = s.send(prepped, timeout=1, **settings)
        if prepped.url.startswith("https://"):
            if not response.url.startswith("https://"):
                return False, "Redirect changed protocol"
            if response.history is not None:
                for res in response.history:
                    if not res.url.startswith("https://"):
                        return False, "Redirect changed protocol"
        return True, response
    except requests.exceptions.Timeout:
        return False, "Connection timeout"
    except requests.exceptions.TooManyRedirects:
        return False, "Too many redirects"
    except requests.exceptions.ConnectionError as e:
        return False, str(e)
    except requests.exceptions.RequestException as e:
        return False, str(e)


def execute_test():
    """
    After test data has been sent to x-nmos/testing-facade figure out which
    test was sent. Call relevant test method and retrieve answers.
    Update json and send back to test suite
    """
    # Get question details from data store 
    question_id = data.getQuestionID()
    answers = data.getAnswers()
    metadata = data.getMetadata()

    # Load specified test suite
    tests = TEST_SUITE

    if question_id.startswith("test_"):
        # Get method associated with question id, set up test browser,
        # run method then tear down and save any answers returned to data store
        method = getattr(tests, question_id)
        if callable(method):
            print(" * Running " + question_id)
            tests.set_up_test()
            test_result = method(answers, metadata)
            tests.tear_down_test()
            data.setAnswer(test_result)

    elif question_id == 'pre_tests_message':
        # Beginning of test set, return to confirm start
        data.setAnswer(None)

    elif question_id == 'post_tests_message':
        # End of test set, return to confirm end
        data.setAnswer(None)
        print(' *** Tests Complete ***')

    else:
        # Not a recognised part of test suite
        return

    # POST answer json back to test suite
    do_request('POST', data.getUrl(), json=json.loads(data.getAnswerJson()))
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

    app.run(host='0.0.0.0', port=5001)
