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
import socket
import sys
from threading import Thread
from flask import Flask, jsonify, request
from selenium.common.exceptions import NoSuchElementException, WebDriverException
from DataStore import dataStore
from IS0404AutoTest import IS0404tests
from IS0503AutoTest import IS0503tests
from BCP0070302AutoTest import BCP0070302tests
import Config as CONFIG

TEST_CLASSES = {'IS0404Test': IS0404tests,
                'IS0503Test': IS0503tests,
                'BCP0070302Test': BCP0070302tests}

TEST_CLASS = None

app = Flask(__name__)


def reset_automation_state():
    """
    Clear per-suite state held by the shared automation instances
    """
    for tests in TEST_CLASSES.values():
        tests.reset_for_new_suite()


def reset_facade_after_suite():
    """
    Reset facade state when a controller test suite has finished
    """
    global TEST_CLASS

    dataStore.clear()
    TEST_CLASS = None
    reset_automation_state()


def select_test_class(test_class_name):
    global TEST_CLASS

    if test_class_name not in TEST_CLASSES:
        raise ValueError('Unknown test class: ' + test_class_name)

    TEST_CLASS = TEST_CLASSES[test_class_name]
    print(' * Selected test class ' + test_class_name)


@app.route('/x-nmos/testquestion/<version>', methods=['GET'], strict_slashes=False)
def controller_tests_get(version):
    """
    Sanity check that the Testing Facade is running and reachable
    """
    return jsonify({
        'status': 'ok',
        'service': 'nmos-js TestingFacade',
        'question_api_version': version,
        'port': CONFIG.TESTING_FACADE_PORT,
        'supported_test_classes': list(TEST_CLASSES.keys()),
        'selected_test_class': TEST_CLASS,
    }), 200


@app.route('/x-nmos/testquestion/<version>', methods=['POST'], strict_slashes=False)
def controller_tests_post(version):
    # Should be json from Test Suite with questions
    expected_entries = ['test_type', 'name', 'description', 'question', 'answers', 'answer_uri']

    if request.json.get('clear'):
        # End of current tests, clear data store
        reset_facade_after_suite()
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

    tests = TEST_CLASS

    if question_id.startswith("test_"):
        if tests is None:
            print(' * ERROR: No test class selected before ' + question_id)
            dataStore.setAnswer(None)
        else:
            # Get method associated with question id, set up test browser,
            # run method then tear down and save any answers returned to data store
            method = getattr(tests, question_id)
            if callable(method):
                print(" * Running " + question_id)
                test_result = None
                try:
                    tests.set_up_test()
                    test_result = method(answers, metadata)
                except NoSuchElementException:
                    test_result = None
                except WebDriverException as error:
                    if 'ERR_CONNECTION_REFUSED' in str(error):
                        print(' * ERROR: Cannot reach nmos-js at {}. '
                              'Start it with "yarn start" in the Development directory.'
                              .format(CONFIG.NCUT_URL))
                    else:
                        print(' * ERROR: ' + str(error))
                    test_result = None
                finally:
                    if getattr(tests, 'driver', None):
                        tests.tear_down_test()
                dataStore.setAnswer(test_result)

    elif question_id == 'pre_tests_message':
        # Beginning of test set; reset and select automated test class from metadata
        reset_automation_state()
        if metadata and metadata.get('test_class'):
            try:
                select_test_class(metadata['test_class'])
            except ValueError as error:
                print(' * ERROR: ' + str(error))
        dataStore.setAnswer(None)

    elif question_id == 'post_tests_message':
        # End of test set, return to confirm end
        dataStore.setAnswer(None)

    else:
        # Not a recognised part of test suite
        dataStore.setAnswer(None)

    # POST answer json back to test suite
    requests.post(dataStore.getUrl(), json=dataStore.getAnswerJson())
    return


def ensure_port_available(port):
    """
    Refuse to start if the configured port is already bound.

    On Windows a stale listener can remain after a crashed facade; Flask may
    then appear to start while connections hang or hit the wrong process.
    """
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as test_socket:
        if sys.platform == 'win32':
            test_socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        try:
            test_socket.bind(('0.0.0.0', port))
        except OSError as error:
            sys.exit(
                'Cannot bind to port {}: {}\n'
                'Another Testing Facade instance, or a stale socket listener, '
                'is already using this port.\n'
                'Try a different TESTING_FACADE_PORT in Config.py, stop the '
                'other process, or reboot to clear stale listeners on Windows.'
                .format(port, error))


if __name__ == "__main__":
    ensure_port_available(CONFIG.TESTING_FACADE_PORT)
    print(' * Sanity check: GET http://127.0.0.1:{}/x-nmos/testquestion/v1.0'.format(
        CONFIG.TESTING_FACADE_PORT))
    app.run(host='0.0.0.0', port=CONFIG.TESTING_FACADE_PORT)
