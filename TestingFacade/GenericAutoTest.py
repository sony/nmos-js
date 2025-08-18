import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
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
        get_options = getattr(webdriver, CONFIG.BROWSER + 'Options', False)
        if get_options:
            options = get_options()
            if CONFIG.HEADLESS:
                options.add_argument("--headless=new")
            self.driver = browser(options=options)
        else:
            self.driver = browser()
        self.driver.implicitly_wait(CONFIG.WAIT_TIME)
        # Launch browser, navigate to nmos-js and update query api url to mock registry
        self.driver.get(self.NCuT_url + "Settings")
        query_api = self.driver.find_element(By.NAME, "queryapi")
        query_api.clear()
        if query_api.get_attribute('value') != '':
            time.sleep(1)
            query_api.send_keys(Keys.CONTROL + "a")
            query_api.send_keys(Keys.DELETE)
        query_api.send_keys(self.mock_registry_url + "x-nmos/query/v1.3")

        # Ensure that RQL is switched off
        use_rql = self.driver.find_element(By.NAME, "userql")
        if use_rql.get_attribute('checked') == "true":
            use_rql.click()

        # Open menu to show link names if not already open
        open_menu = self.driver.find_elements(By.XPATH, '//*[@title="Open menu"]')
        if open_menu:
            open_menu[0].click()

    def tear_down_test(self):
        self.driver.close()

    def refresh_page(self):
        """
        Click refresh button and sleep to allow loading time
        """
        refresh = WebDriverWait(self.driver, 20).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "[aria-label='Refresh']")))
        refresh.click()
        time.sleep(1)

    def navigate_to_page(self, page):
        """
        Navigate to page by link text, refresh page and sleep to allow loading time
        """
        self.driver.find_element(By.LINK_TEXT, page).click()
        self.refresh_page()

    def find_resource_labels(self):
        """
        Find all resources on a page by label
        Returns list of labels
        """
        resources = self.driver.find_elements(By.NAME, "label")
        return [entry.text for entry in resources]

    def next_page(self):
        """
        Navigate to next page via next button and sleep to allow loading time
        """
        self.driver.find_element(By.NAME, "next").click()
        time.sleep(1)

    def check_connectable(self):
        """
        Check if connect tab is active
        returns True if available, False if disabled
        """
        connect_button = WebDriverWait(self.driver, 10).until(EC.visibility_of_element_located((By.NAME,
                                                                                                "connect")))
        disabled = connect_button.get_attribute("aria-disabled")
        return True if disabled == 'false' else False

    def make_connection(self, sender):
        """
        Navigate to connect tab, activate connection to given sender
        """
        connect = WebDriverWait(self.driver, 20).until(EC.element_to_be_clickable((By.NAME, "connect")))
        connect.click()

        # Find the row containing the correct sender and activate connection
        senders = self.find_resource_labels()
        row = [i for i, s in enumerate(senders) if s == sender][0]
        activate_button = self.driver.find_elements(By.NAME, "activate")[row]
        activate_button.click()
        time.sleep(2)

    def remove_connection(self, receiver):
        """
        Deactivate a connection on a given receiver
        """
        receivers = self.find_resource_labels()
        row = [i for i, r in enumerate(receivers) if r == receiver][0]
        deactivate_button = self.driver.find_elements(By.NAME, "active")[row]
        if deactivate_button.get_attribute('value') == "true":
            deactivate_button.click()
        time.sleep(2)

    def get_active_receiver(self):
        """
        Identify an active receiver
        Returns string of receiver label or None
        """
        active_buttons = self.driver.find_elements(By.NAME, 'active')
        active_row = [i for i, b in enumerate(active_buttons) if b.get_attribute('value') == "true"]
        return None if not active_row else self.driver.find_elements(By.NAME, 'label')[active_row[0]].text

    def get_connected_sender(self):
        """
        Identify the sender a receiver is connected to
        Returns string of sender label
        """
        active = WebDriverWait(self.driver, 20).until(EC.element_to_be_clickable((By.NAME, "active")))
        active.click()

        return self.driver.find_element(By.NAME, "sender").text