import time
from GenericAutoTest import GenericAutoTest


class IS0503AutoTest(GenericAutoTest):
    """
    Automated version of NMOS Controller test suite IS0503
    """
    def test_01(self, answers, metadata):
        """
        Identify which Receiver devices are controllable via IS-05
        """
        # A subset of the Receivers registered with the Registry are controllable via IS-05,
        # for instance, allowing Senders to be connected.
        # Please refresh your NCuT and select the Receivers
        # that have a Connection API from the list below.
        # Be aware that if your NCuT only displays Receivers which have a Connection API,
        # some of the Receivers in the following list may not be visible.

        self.navigate_to_page('Receivers')
        receivers = self.find_resource_labels()
        
        # Loop through receivers and check if connection tab is disabled
        connectable_receivers = []
        
        for receiver in receivers:
            self.navigate_to_page(receiver)
            connectable = self.check_connectable()
            if connectable:
                connectable_receivers.append(receiver)
            self.navigate_to_page('Receivers')

        # Get answer ids for connectable receivers to send to test suite
        actual_answers = [answer['answer_id'] for answer in answers if answer['resource']['label']
                          in connectable_receivers]

        return actual_answers

    def test_02(self, answers, metadata):
        """
        Instruct Receiver to subscribe to a Sender’s Flow via IS-05
        """
        # All flows that are available in a Sender should be able to be
        # connected to a Receiver.
        # Use the NCuT to perform an 'immediate' activation between
        # sender: x and receiver: y
        # Click the 'Next' button once the connection is active.

        # Get sender and receiver details from metadata sent with question
        sender = metadata['sender']
        receiver = metadata['receiver']

        self.navigate_to_page('Receivers')
        self.navigate_to_page(receiver['label'])
        self.make_connection(sender['label'])

    def test_03(self, answers, metadata):
        """
        Disconnecting a Receiver from a connected Flow via IS-05
        """
        # IS-05 provides a mechanism for removing an active connection
        # through its API.
        # Use the NCuT to remove the connection between sender: x and
        # receiver: y
        # Click the 'Next' button once the connection has been removed.'

        receiver = metadata['receiver']
        self.navigate_to_page('Receivers')
        self.remove_connection(receiver['label'])

    def test_04(self, answers, metadata):
        """
        Indicating the state of connections via updates received from the
        IS-04 Query API
        First question
        """
        # The NCuT should be able to monitor and update the connection status
        # of all registered Devices.
        # Use the NCuT to identify the receiver that has just been activated.

        self.navigate_to_page('Receivers')
        receiver = self.get_active_receiver()

        actual_answer = [answer['answer_id'] for answer in answers if answer['resource']['label'] == receiver][0]

        return actual_answer

    def test_04_1(self, answers, metadata):
        """
        Indicating the state of connections via updates received from the
        IS-04 Query API
        Second question
        """
        # Use the NCuT to identify the sender currently connected to receiver x
        receiver = metadata['receiver']
        self.navigate_to_page('Receivers')
        self.navigate_to_page(receiver['label'])
        sender = self.get_connected_sender()

        actual_answer = [answer['answer_id'] for answer in answers if answer['resource']['label'] == sender][0]

        return actual_answer

    def test_04_2(self, answers, metadata):
        """
        Indicating the state of connections via updates received from the
        IS-04 Query API
        Third Question
        """
        # The connection on the following receiver will be disconnected
        # at a random moment within the next x seconds.
        # receiver x
        # As soon as the NCuT detects the connection is inactive please
        # press the 'Next' button.
        # The button must be pressed within x seconds of the connection
        # being removed.
        # This includes any latency between the connection being removed
        # and the NCuT updating.

        receiver = metadata['receiver']
        self.navigate_to_page('Receivers')

        # Periodically refresh until no receiver is active
        for i in range(1, 20):
            time.sleep(4)
            self.refresh_page()
            receiver = self.get_active_receiver()
            if not receiver:
                break


IS0503tests = IS0503AutoTest()
