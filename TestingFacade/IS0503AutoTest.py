import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options


class IS0503AutoTest:
    """
    Automated version of NMOS Controller test suite without Testing Façade
    """
    def __init__(self):
        self.NCuT_url = "http://localhost:3000/#/" # url of nmos-js instance
        self.mock_registry_url = "http://127.0.0.1:5102/" # url of mock registry from test suite
        self.multipart_question_storage = {}
        
    def set_up_test(self):    
        options = Options()
        options.headless = True
        self.driver = webdriver.Chrome(options=options) #selenium driver for browser
        self.driver.implicitly_wait(10) # seconds to wait for elements to load
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
        except:
            pass

    def tear_down_test(self):
        self.driver.close()

    def _format_device_metadata(self, label, description, id):
        """ Used to format answers based on device metadata """
        return label + ' (' + description + ', ' + id + ')'

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
        Identify which Receiver devices are controllable via IS-05
        """
        # Some of the discovered Receivers are controllable via IS-05, for instance, allowing Senders to be connected.
        # Additional Receivers have just been registered with the Registry, a subset of which have a connection API.
        # Please refresh your NCuT and select the Receivers that have a connection API from the list below.
        # Be aware that if your NCuT only displays Receivers which have a connection API, some of the Receivers in the following list may not be visible.

        receiver_labels = self._find_resources('Receivers')
        connectable_receivers = []

        # loop through receivers and check if connection tab is disabled
        for receiver in receiver_labels:
            self.driver.find_element_by_link_text(receiver).click()
            
            connect_button = WebDriverWait(self.driver, 10).until(EC.visibility_of_element_located((By.NAME, "connect"))) 
            time.sleep(3)

            if connect_button.get_attribute("aria-disabled") == 'false':
                connectable_receivers.append(receiver)
            self.driver.find_element_by_link_text('Receivers').click()

        actual_answers = [answer['answer_id'] for answer in answers if answer['label'] in connectable_receivers]

        return actual_answers

    def test_02(self, answers, metadata):
        """
        Instruct Receiver to subscribe to a Sender’s Flow via IS-05
        """
        # All flows that are available in a Sender should be able to be connected to a Receiver.
        # Use the NCuT to perform an 'immediate' activation between sender: x and receiver: y
        # Click the 'Next' button once the connection is active.'

        sender = metadata['sender']
        receiver = metadata['receiver']

        self.driver.find_element_by_link_text('Receivers').click()
        self.driver.find_element_by_css_selector("[aria-label='Refresh']").click()
        time.sleep(1)
        self.driver.find_element_by_link_text(receiver['label']).click()

        connect = WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable((By.NAME, "connect")))
        time.sleep(3)
        connect.click()

        # Find the row containing the correct sender and activate connection
        senders = self.driver.find_elements_by_name('label')
        row = [i for i, s in enumerate(senders) if s.text == sender['label']][0]
        activate_button = self.driver.find_elements_by_name("activate")[row]
        activate_button.click()
        time.sleep(3)

        active_sender = WebDriverWait(self.driver, 10).until(EC.visibility_of_element_located((By.NAME, "sender"))) 

        if active_sender.text == sender['label']:
            return "Next"
        else:
            return "Something went wrong"

    def test_03(self, answers, metadata):
        """
        Disconnecting a Receiver from a connected Flow via IS-05
        """
        # IS-05 provides a mechanism for removing an active connection through its API.
        # Use the NCuT to remove the connection between sender: x and receiver: y
        # Click the 'Next' button once the connection has been removed.'

        sender = metadata['sender']
        receiver = metadata['receiver']

        self.driver.find_element_by_link_text('Receivers').click()
        self.driver.find_element_by_css_selector("[aria-label='Refresh']").click()
        time.sleep(1)

        # Find the row for the given receiver and click the deactivate button
        receivers = self.driver.find_elements_by_name('label')
        row = [i for i, r in enumerate(receivers) if r.text == receiver['label']][0]
        deactivate_button = self.driver.find_elements_by_name("active")[row]
        deactivate_button.click()
        time.sleep(2)

        if deactivate_button.get_attribute('value') == "false":
            return "Next"
        else:
            return "Something went wrong"

    def test_04(self, answers, metadata):
        """
        Indicating the state of connections via updates received from the IS-04 Query API
        First question
        """
        # The NCuT should be able to monitor and update the connection status of all registered Devices. \
        # Use the NCuT to identify the receiver that has just been activated.

        self.driver.find_element_by_link_text('Receivers').click()
        self.driver.find_element_by_css_selector("[aria-label='Refresh']").click()
        time.sleep(1)
        # Assuming only one active receiver
        # Find the row where the active button is true
        active_buttons = self.driver.find_elements_by_name('active')
        active_row = [i for i, b in enumerate(active_buttons) if b.get_attribute('value') == "true"][0]
        receiver = self.driver.find_elements_by_name('label')[active_row]
        receiver_label = receiver.text

        actual_answer = [answer['answer_id'] for answer in answers if answer['label'] == receiver_label][0]

        return actual_answer

    def test_04_1(self, answers, metadata):
        """
        Indicating the state of connections via updates received from the IS-04 Query API
        Second question
        """
        # Use the NCuT to identify the sender currently connected to receiver x
        receiver = metadata['receiver']
        self.driver.find_element_by_link_text('Receivers').click()
        self.driver.find_element_by_link_text(receiver['label']).click()
        active = WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable((By.NAME, "active")))
        time.sleep(3)
        active.click()

        # Find sender from receiver's active tab
        sender_label = self.driver.find_element_by_name('sender').text

        actual_answer = [answer['answer_id'] for answer in answers if answer['label'] == sender_label][0]

        return actual_answer

    def test_04_2(self, answers, metadata):
        """
        Indicating the state of connections via updates received from the IS-04 Query API
        Third Question
        """
        # The connection on the following receiver will be disconnected at a random moment within the next x seconds.
        # receiver x
        # As soon as the NCuT detects the connection is inactive please press the 'Next' button.
        # The button must be pressed within x seconds of the connection being removed. 
        # This includes any latency between the connection being removed and the NCuT updating.

        receiver = metadata['receiver']
        self.driver.find_element_by_link_text('Receivers').click()
        self.driver.find_element_by_css_selector("[aria-label='Refresh']").click()
        time.sleep(1)
        
        # Find currently active receiver
        receivers = self.driver.find_elements_by_name('label')
        active_receiver = [i for i, r in enumerate(receivers) if r.text == receiver['label']][0]
        active_button = 'true'

        # Periodically refresh until active button is false
        while active_button == 'true':
            self.driver.find_element_by_css_selector("[aria-label='Refresh']").click()
            time.sleep(1)
            active_buttons = self.driver.find_elements_by_name('active')
            active_button = active_buttons[active_receiver].get_attribute('value')
            time.sleep(4)

        return 'Next'

IS0503tests = IS0503AutoTest()
