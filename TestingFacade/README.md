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

5. Run TestingFacade.py with your chosen test suite specified using the `--suite` command line argument. Eg. `python3 TestingFacade.py --suite 'IS0404'`.  
Currently supported test suites are:  
    - IS0404  
    - IS0503  

6. On your NMOS Testing instance enter the IP address and Port where the Automated Testing Facade is running

7. Choose tests and click Run. The Testing Facade will launch a new headless browser at the beginning of each test and close it at the end. Note: Set the value of `HEADLESS` in `Config.py` to `False` to have the tests run in visible browser windows

8. Test suite `POST`s the Question JSON to the TestingFacade API endpoint `/x-nmos/testquestion/{version}`. TestingFacade will retrieve the data and run the relevant set of selenium instructions defined in the test suite file to complete the test in your chosen browser then `POST`s the Answer JSON back to the test suite via the endpoint given in the `answer_uri` of the Question

9. After the last test, test suite will `POST` a clear request to empty the data store

10. Results are displayed on NMOS Testing tool
