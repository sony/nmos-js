# NMOS Controller testing - Fully Automated testing of nmos-js

## Installation and usage

1. Install flask and selenium
`pip install -r requirements.txt`

2. Install the webdriver for the browser you wish to use. [See selenium docs for more info.](https://www.selenium.dev/documentation/en/webdriver/driver_requirements/#quick-reference) 

3. Update the configuration file `Config.py` if necessary. 
    - `NCUT_URL` the url of your instance of nmos-js 
    - `MOCK_REGISTRY_URL` the url of the mock registry set up by the NMOS Controller test suite, included in the `pre_tests_message`
    - `BROWSER` the name of the browser for which you installed the driver in step 2  

4. Run the NMOS Testing tool (https://github.com/AMWA-TV/nmos-testing) and choose a Controller test suite

5. Start nmos-js (`yarn start` in the `Development` directory). The Testing Facade drives a browser against `http://localhost:3000` — if nmos-js is not running, tests will fail with `ERR_CONNECTION_REFUSED`.

6. Start TestingFacade.py (`python3 TestingFacade.py`). The controller test class to automate is selected automatically when NMOS Testing sends the pre-test message for each suite.  
The facade resets when each suite starts (`pre_tests_message`) and when NMOS Testing sends a clear request at tear-down. Stop it with Ctrl+C when finished.  
To confirm the facade is listening, open `http://127.0.0.1:5001/x-nmos/testquestion/v1.0` in a browser (adjust the port if you changed `TESTING_FACADE_PORT`). A JSON response with `"status": "ok"` indicates the service is live.  
Currently supported controller test classes are:
    - IS0404Test  
    - IS0503Test  
    - BCP0070302Test  

7. On your NMOS Testing instance enter the IP address and Port where the Automated Testing Facade is running

8. Choose tests and click Run. The Testing Facade will launch a new headless browser at the beginning of each test and close it at the end. Note: Set the value of `HEADLESS` in `Config.py` to `False` to have the tests run in visible browser windows

9. Test suite `POST`s the Question JSON to the TestingFacade API endpoint `/x-nmos/testquestion/{version}`. TestingFacade will retrieve the data and run the relevant set of selenium instructions defined in the test suite file to complete the test in your chosen browser then `POST`s the Answer JSON back to the test suite via the endpoint given in the `answer_uri` of the Question

10. After each suite, NMOS Testing sends a clear request to reset the facade. After the last suite, stop the facade with Ctrl+C.

11. Results are displayed on NMOS Testing tool
