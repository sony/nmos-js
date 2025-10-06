import time
from GenericAutoTest import GenericAutoTest


class IS0404AutoTest(GenericAutoTest):
    """
    Automated version of NMOS Controller test suite IS0404
    """

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

        self.navigate_to_page('Senders')
        self.navigate_to_page('Receivers')

    def test_03(self, answers, metadata):
        """
        Query API should be able to discover all the senders that are
        registered in the Registry
        """
        # The NCuT should be able to discover all the Senders that are
        # registered in the Registry.
        # Refresh the NCuT's view of the Registry and carefully select
        # the Senders that are available from the following list.
        # For this test the registry paging limit has been set to 2.
        # If your NCuT implements pagination, you must ensure you view
        # every available page to complete this test.

        self.navigate_to_page('Senders')
        
        # Loop through pages gathering all senders        
        actual_answers = []

        for i in range(len(answers)):
            senders = self.find_resource_labels()
            if not senders:
                break
            actual_answers += [answer['answer_id'] for answer in answers if answer['resource']['label']
                               in senders]
            self.next_page()

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
        # For this test the registry paging limit has been set to 2.
        # If your NCuT implements pagination, you must ensure you view
        # every available page to complete this test.

        self.navigate_to_page('Receivers')
        
        # Loop through pages gathering all receivers        
        actual_answers = []

        for i in range(len(answers)):
            receivers = self.find_resource_labels()
            if not receivers:
                break
            actual_answers += [answer['answer_id'] for answer in answers if answer['resource']['label']
                               in receivers]
            self.next_page()

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
        self.navigate_to_page('Senders')
        self.multipart_question_storage['test_05'] = self.find_resource_labels()

    def test_05_1(self, answers, metadata):
        """
        Reference Sender is put offline then back online
        Second question
        """
        # Please refresh your NCuT and select the sender which has been put
        # 'offline'

        # Get current list of senders and compare against previously saved list
        self.navigate_to_page('Senders')
        sender_list = self.find_resource_labels()
        offline_sender = list(set(self.multipart_question_storage['test_05']) - set(sender_list))
        # Save offline sender
        self.multipart_question_storage['test_05_1'] = offline_sender[0]

        actual_answer = [answer['answer_id'] for answer in answers
                         if answer['resource']['label'] == offline_sender[0]][0]

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

        self.navigate_to_page('Senders')
        sender_list = set()

        # Find all senders, keep checking until same as number of senders at start of test
        while len(sender_list) < len(self.multipart_question_storage['test_05']):
            time.sleep(4)
            self.refresh_page()
            senders = self.find_resource_labels()
            sender_list.update(senders)
            last_sender = senders[-1]

        # Check same sender came back
        if last_sender == self.multipart_question_storage['test_05_1']:
            return "Next"
        else:
            return "Unrecognised Sender"


IS0404tests = IS0404AutoTest()
