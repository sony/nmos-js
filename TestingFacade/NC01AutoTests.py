import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class NC01AutoTest:
    """
    Automated version of NMOS Controller test suite without Testing Façade
    """
    def __init__(self):
        self.NCuT_url = "http://localhost:3000/#/" # url of nmos-js instance
        self.mock_registry_url = "http://127.0.0.1:5102/" # url of mock registry from test suite
        self.multipart_question_storage = {}
        self.driver = webdriver.Chrome() #selenium driver for browser
        # Launch browser, navigate to nmos-js and update query api url to mock registry
        self.driver.get(self.NCuT_url + "Settings")
        query_api = self.driver.find_element_by_xpath("//main/div[2]/div/div/div/ul/li[1]/div/div/input")
        query_api.clear()
        query_api.send_keys(self.mock_registry_url + "x-nmos/query/v1.3")
        time.sleep(2)

    def _format_device_metadata(self, label, description, id):
        """ Used to format answers based on device metadata """
        return label + ' (' + description + ', ' + id + ')'

    def _find_resources(self, resource, keyword):
        """
        Navigate to resource page, look for labels by keyword and return list of resources
        resource: 'senders' 'receivers'
        """
        self.driver.find_element_by_link_text(resource).click()
        time.sleep(2)

        # Find all resources
        resources = self.driver.find_elements_by_partial_link_text(keyword)
        resource_labels = [entry.text for entry in resources]
        resource_list = []

        # loop through resources and gather ids and descriptions
        for label in resource_labels:
            self.driver.find_element_by_link_text(label).click()
            time.sleep(2)
            resource_id = self.driver.find_element_by_xpath("//div[@class='ra-field ra-field-id']/div/div/span").text
            resource_description = self.driver.find_element_by_xpath("//div[@class='ra-field ra-field-description']/div/div/span").text
            resource_list.append(self._format_device_metadata(label, resource_description, resource_id))
            self.driver.find_element_by_link_text(resource).click()
        
        return resource_list

    def test_01(self, answers, metadata):
        """
        Ensure NCuT uses DNS-SD to find registry
        """
        return "NMOS-js does not use DNS-SD to find registry"

    def test_02(self, answers, metadata):
        """
        Ensure NCuT can access the IS-04 Query API
        """
        # Use the NCuT to browse the Senders and Receivers on the discovered Registry via the selected IS-04 Query API.
        # Once you have finished browsing click the 'Next' button.
        # Successful browsing of the Registry will be automatically logged by the test framework.
        
        # Browse senders and receivers
        time.sleep(2)
        self.driver.find_element_by_link_text('Senders').click()
        time.sleep(2)
        self.driver.find_element_by_link_text('Receivers').click()
        time.sleep(2)

        return "Next"

    def test_03(self, answers, metadata):
        """
        Query API should be able to discover all the senders that are registered in the Registry
        """
        # The NCuT should be able to discover all the Senders that are registered in the Registry.
        # Refresh the NCuT's view of the Registry and carefully select the Senders that are available from the following list.
        time.sleep(2)

        return self._find_resources("Senders", "Test-node-1/sender")

    def test_04(self, answers, metadata):
        """
        Query API should be able to discover all the receivers that are registered in the Registry
        """
        # The NCuT should be able to discover all the Receivers that are registered in the Registry.
        # Refresh the NCuT's view of the Registry and carefully select the Receivers that are available from the following list.
        time.sleep(2)
        
        return self._find_resources("Receivers", "Test-node-2/receiver")

    def test_05(self, answers, metadata):
        """
        Reference Sender is put offline then back online
        First question
        """
        # The NCuT should be able to discover and dynamically update all the Senders that are registered in the Registry.
        # Use the NCuT to browse and take note of the Senders that are available.
        # After the 'Next' button has been clicked one of those senders will be put 'offline'.
        time.sleep(2)
        self.multipart_question_storage['test_05'] = self._find_resources("Senders", "Test-node-1/sender")
        
        return "Next"

    def test_05_1(self, answers, metadata):
        """
        Reference Sender is put offline then back online
        Second question
        """
        # Please refresh your NCuT and select the sender which has been put 'offline'
        time.sleep(5)
        sender_list = self._find_resources("Senders", "Test-node-1/sender")

        # Hmm Assuming only a one item difference always. May need to add an if len==1 check and raise an exception if not
        offline_sender = list(set(self.multipart_question_storage['test_05']) - set(sender_list))
        self.multipart_question_storage['test_05_1'] = offline_sender
        return offline_sender[0]

    def test_05_2(self, answers, metadata):
        """
        Reference Sender is put offline then back online
        Third question
        """
        # The sender which was put 'offline' will come back online at a random moment within the next x seconds.
        # As soon as the NCuT detects the sender has come back online please press the 'Next' button.
        # The button must be pressed within x seconds of the Sender being put back 'online'.
        # This includes any latency between the Sender being put 'online' and the NCuT updating.
        time.sleep(5)
        self.driver.find_element_by_link_text("Senders").click()
        sender_list = set()

        # Find all senders, keep checking until same as number of senders at start of test
        while len(sender_list) < len(self.multipart_question_storage['test_05']):
            self.driver.refresh()
            time.sleep(2)
            senders = self.driver.find_elements_by_partial_link_text("Test-node-1/sender")
            sender_list.update([entry.text for entry in senders])
            last_sender = senders[-1].text
            time.sleep(2)
            
        # Check same sender came back
        sender_details = self._find_resources("Senders", last_sender)
        if sender_details == self.multipart_question_storage['test_05_1']:
            return "Next"
        else:
            return "Unrecognised Sender"

    def test_06(self, answers, metadata):
        """
        Identify which Receiver devices are controllable via IS-05
        """
        # Some of the discovered Receivers are controllable via IS-05, for instance, allowing Senders to be connected.
        # Additional Receivers have just been registered with the Registry, a subset of which have a connection API.
        # Please refresh your NCuT and select the Receivers that have a connection API from the list below.
        # Be aware that if your NCuT only displays Receivers which have a connection API, some of the Receivers in the following list may not be visible.
        time.sleep(2)
        self.driver.find_element_by_link_text('Receivers').click()
        time.sleep(2)
        # Find all receivers
        receivers = self.driver.find_elements_by_partial_link_text("Test-node-2/receiver")
        receiver_labels = [receiver.text for receiver in receivers]
        potential_answers = []

        # loop through receivers and check if connection tab is disabled
        for receiver in receiver_labels:
            self.driver.find_element_by_link_text(receiver).click()
            time.sleep(2)
            receiver_id = self.driver.find_element_by_xpath("//div[@class='ra-field ra-field-id']/div/div/span").text
            receiver_description = self.driver.find_element_by_xpath("//div[@class='ra-field ra-field-description']/div/div/span").text
            
            connect_button = WebDriverWait(self.driver, 10).until(EC.visibility_of_element_located((By.XPATH, "//main/div[2]/div[1]/div[1]/div/div/div/a[4]"))) 
            
            if connect_button.get_attribute("aria-disabled") == 'false':
                potential_answers.append(self._format_device_metadata(receiver, receiver_description, receiver_id))
            self.driver.find_element_by_link_text('Receivers').click()

        # Remove the connectable receivers that aren't part of the answer set given
        actual_answers = []
        for answer in potential_answers:
            if answer in answers:
                actual_answers.append(answer)

        return actual_answers

    def test_07(self, answers, metadata):
        """
        Instruct Receiver to subscribe to a Sender’s Flow via IS-05
        """
        # All flows that are available in a Sender should be able to be connected to a Receiver.
        # Use the NCuT to perform an 'immediate' activation between sender: x and receiver: y
        # Click the 'Next' button once the connection is active.'

        sender = metadata['sender']
        receiver = metadata['receiver']

        # TODO
        # Navigate to receivers connect tab
        # Identify correct row for the sender and click activate button
        # Wait for redirect to active page and verify correct sender listed
        # Return Next 
        return "Test not yet implemented"

    def test_08(self, answers, metadata):
        """
        Disconnecting a Receiver from a connected Flow via IS-05
        """
        # IS-05 provides a mechanism for removing an active connection through its API.
        # Use the NCuT to remove the connection between sender: x and receiver: y
        # Click the 'Next' button once the connection has been removed.'

        sender = metadata['sender']
        receiver = metadata['receiver']

        # TODO
        # Navigate to all receivers page
        # Identify correct row for the receiver and click the active boolean switch
        # Wait for switch to show False? 
        # Navigate to receivers active tab to check sender is gone
        # Return Next

        return "Test not yet implemented"

    def test_09(self, answers, metadata):
        """
        Indicating the state of connections via updates received from the IS-04 Query API
        First question
        """
        # The NCuT should be able to monitor and update the connection status of all registered Devices.
        # Use the NCuT to identify the sender currently connected to receiver: x

        receiver = metadata['receiver']

        # TODO
        # Navigate to the receivers active tab
        # Get sender name and navigate to senders page to grab id, label, description
        # Return sender
        return "Test not yet implemented"

    def test_09_1(self, answers, metadata):
        """
        Indicating the state of connections via updates received from the IS-04 Query API
        Second question
        """
        # The connection on the following receiver will be disconnected at a random moment within the next x seconds.
        # receiver x
        # As soon as the NCuT detects the connection is inactive please press the 'Next' button.
        # The button must be pressed within x seconds of the connection being removed. 
        # This includes any latency between the connection being removed and the NCuT updating.

        receiver = metadata['receiver']

        # TODO
        # Navigate to receivers page 
        # While loop to check Active, refresh and wait until Active is No
        # Return Next
        return "Test not yet implemented"
  
tests = NC01AutoTest()