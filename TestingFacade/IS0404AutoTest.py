import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import NoSuchElementException
import Config as CONFIG


class IS0404AutoTest:
    """
    Automated version of NMOS Controller test suite without Testing Façade
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

    def test_01(self, answers, metadata):
        """
        Ensure NCuT uses DNS-SD to find registry
        """
        return "NMOS-js does not use DNS-SD to find registry"

    def test_02(self, answers, metadata):
        """
        Ensure NCuT can access the IS-04 Query API
        """
        # Use the NCuT to browse the Senders and Receivers on the
        # discovered Registry via the selected IS-04 Query API.
        # Once you have finished browsing click the 'Next' button.
        # Successful browsing of the Registry will be automatically
        # logged by the test framework.

        # Browse senders and receivers
        self.driver.find_element_by_link_text('Senders').click()
        time.sleep(2)
        self.driver.find_element_by_link_text('Receivers').click()
        time.sleep(2)

        return "Next"

    def test_03(self, answers, metadata):
        """
        Query API should be able to discover all the senders that are
        registered in the Registry
        """
        # The NCuT should be able to discover all the Senders that are
        # registered in the Registry.
        # Refresh the NCuT's view of the Registry and carefully select
        # the Senders that are available from the following list.
        self.driver.find_element_by_link_text('Senders').click()
        self.driver.find_element_by_css_selector("[aria-label='Refresh']").click()
        time.sleep(1)
        actual_answers = []

        for i in range(len(answers)):
            senders = self.driver.find_elements_by_name('label')
            sender_labels = [sender.text for sender in senders]
            actual_answers += [answer['answer_id'] for answer in answers if answer['resource']['label'] in sender_labels]

            next_button = self.driver.find_element_by_name('next')
            if next_button.get_attribute('disabled'):
                break
            else:
                next_button.click()
                time.sleep(1)

        return actual_answers

    def test_04(self, answers, metadata):
        """
        Query API should be able to discover all the receivers that are
        registered in the Registry
        """
        # The NCuT should be able to discover all the Receivers that are
        # registered in the Registry.
        # Refresh the NCuT's view of the Registry and carefully select
        # the Receivers that are available from the following list.
        self.driver.find_element_by_link_text('Receivers').click()
        self.driver.find_element_by_css_selector("[aria-label='Refresh']").click()
        time.sleep(1)
        actual_answers = []

        for i in range(len(answers)):
            receivers = self.driver.find_elements_by_name('label')
            receiver_labels = [receiver.text for receiver in receivers]
            actual_answers += [answer['answer_id'] for answer in answers if answer['resource']['label'] in receiver_labels]

            next_button = self.driver.find_element_by_name('next')
            if next_button.get_attribute('disabled'):
                break
            else:
                next_button.click()
                time.sleep(1)

        return actual_answers

    def test_05(self, answers, metadata):
        """
        Reference Sender is put offline then back online
        First question
        """
        # The NCuT should be able to discover and dynamically update all
        # the Senders that are registered in the Registry.
        # Use the NCuT to browse and take note of the Senders that are
        # available.
        # After the 'Next' button has been clicked one of those senders
        # will be put 'offline'.

        # Save current list of senders
        self.multipart_question_storage['test_05'] = self._find_resources("Senders")

        return "Next"

    def test_05_1(self, answers, metadata):
        """
        Reference Sender is put offline then back online
        Second question
        """
        # Please refresh your NCuT and select the sender which has been put
        # 'offline'
        sender_list = self._find_resources("Senders")

        # Assuming only a one item difference always.
        # May need to add an if len==1 check and raise an exception if not
        offline_sender = list(set(self.multipart_question_storage['test_05']) - set(sender_list))
        self.multipart_question_storage['test_05_1'] = offline_sender[0]

        actual_answer = [answer['answer_id'] for answer in answers if answer['resource']['label'] == offline_sender[0]][0]

        return actual_answer

    def test_05_2(self, answers, metadata):
        """
        Reference Sender is put offline then back online
        Third question
        """
        # The sender which was put 'offline' will come back online at a
        # random moment within the next x seconds.
        # As soon as the NCuT detects the sender has come back online
        # please press the 'Next' button.
        # The button must be pressed within x seconds of the Sender being
        # put back 'online'.
        # This includes any latency between the Sender being put 'online'
        # and the NCuT updating.

        self.driver.find_element_by_link_text("Senders").click()
        self.driver.find_element_by_css_selector("[aria-label='Refresh']").click()
        sender_list = set()

        # Find all senders, keep checking until same as number of senders at start of test
        while len(sender_list) < len(self.multipart_question_storage['test_05']):
            self.driver.find_element_by_css_selector("[aria-label='Refresh']").click()
            time.sleep(1)
            senders = self.driver.find_elements_by_name("label")
            sender_list.update([entry.text for entry in senders])
            last_sender = senders[-1].text
            time.sleep(4)

        # Check same sender came back
        if last_sender == self.multipart_question_storage['test_05_1']:
            return "Next"
        else:
            return "Unrecognised Sender"


IS0404tests = IS0404AutoTest()
