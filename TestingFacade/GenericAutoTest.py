import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoSuchElementException
import Config as CONFIG

class GenericAutoTest:
    """
    Base test class for automated version of NMOS Controller test suite without Testing Façade
    """
    def __init__(self):
        self.NCuT_url = CONFIG.NCUT_URL
        self.mock_registry_url = CONFIG.MOCK_REGISTRY_URL
        self.multipart_question_storage = {}

    def set_up_test(self):
        # Set up webdriver
        browser = getattr(webdriver, CONFIG.BROWSER)
        try:
            # Not all webdrivers support options
            options = getattr(webdriver, CONFIG.BROWSER + 'Options')()
            options.headless = CONFIG.HEADLESS
            self.driver = browser(options=options)
        except AttributeError:
            self.driver = browser()
        self.driver.implicitly_wait(CONFIG.WAIT_TIME)
        # Launch browser, navigate to nmos-js and update query api url to mock registry
        self.driver.get(self.NCuT_url + "Settings")
        query_api = self.driver.find_element_by_name("queryapi")
        query_api.clear()
        if query_api.get_attribute('value') != '':
            time.sleep(1)
            query_api.send_keys(Keys.CONTROL + "a")
            query_api.send_keys(Keys.DELETE)
        query_api.send_keys(self.mock_registry_url + "x-nmos/query/v1.3")
        # Open menu to show link names if not already open
        try:
            self.driver.find_element_by_xpath('//*[@title="Open menu"]').click()
        except NoSuchElementException:
            pass

    def tear_down_test(self):
        self.driver.close()

    def _find_resources(self, resource):
        """
        Navigate to resource page, and return list of resources
        resource: 'senders' 'receivers'
        """
        self.driver.find_element_by_link_text(resource).click()
        self.driver.find_element_by_css_selector("[aria-label='Refresh']").click()
        time.sleep(1)

        # Find all resources
        resources = self.driver.find_elements_by_name("label")
        resource_labels = [entry.text for entry in resources]

        return resource_labels