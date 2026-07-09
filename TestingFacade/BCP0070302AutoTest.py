from GenericAutoTest import GenericAutoTest


class BCP0070302AutoTest(GenericAutoTest):
    """
    Automated version of NMOS Controller test suite BCP-007-03-02 (MXL)
    """

    MXL_TRANSPORT_LABEL = 'MXL'

    def _transport_matches_label(self, transport_text, transport_label):
        if not transport_text:
            return False
        if transport_text == transport_label:
            return True
        # nmos-js may show the full transport URN when friendly names are disabled
        normalized_label = transport_label.lower()
        return normalized_label in transport_text.lower()

    def set_up_test(self):
        super().set_up_test()
        # BCP-004-01 receiver capabilities filtering requires RQL
        self.set_rql_enabled(True)

    def test_01(self, answers, metadata):
        """
        Ensure NCuT can discover MXL Senders via the IS-04 Query API
        """
        self.navigate_to_page('Senders')

        mxl_sender_labels = []
        for answer in answers:
            label = answer['resource']['label']
            self.navigate_to_page(label)
            if self._transport_matches_label(
                    self.get_summary_transport(), self.MXL_TRANSPORT_LABEL):
                mxl_sender_labels.append(label)
            self.navigate_to_page('Senders')

        return [
            answer['answer_id'] for answer in answers
            if answer['resource']['label'] in mxl_sender_labels]

    def test_02(self, answers, metadata):
        """
        Ensure NCuT can discover MXL Receivers via the IS-04 Query API
        """
        self.navigate_to_page('Receivers')

        mxl_receiver_labels = []
        for answer in answers:
            label = answer['resource']['label']
            self.navigate_to_page(label)
            if self._transport_matches_label(
                    self.get_summary_transport(), self.MXL_TRANSPORT_LABEL):
                mxl_receiver_labels.append(label)
            self.navigate_to_page('Receivers')

        return [
            answer['answer_id'] for answer in answers
            if answer['resource']['label'] in mxl_receiver_labels]

    def test_03(self, answers, metadata):
        """
        Connect an MXL Receiver to an MXL Sender via the IS-05 Connection API
        """
        sender = metadata['sender']
        receiver = metadata['receiver']

        self.navigate_to_page('Receivers')
        self.navigate_to_page(receiver['label'])
        self.make_connection(sender['label'])

    def __getattr__(self, name):
        if name == 'test_04' or name.startswith('test_04_'):
            return lambda answers, metadata: self._test_04(answers, metadata)
        raise AttributeError(f'{type(self).__name__!r} object has no attribute {name!r}')

    def _test_04(self, answers, metadata):
        """
        Ensure NCuT can evaluate MXL Flow compatibility using BCP-004-01 Receiver Capabilities
        """
        sender_label = metadata['sender']['label']

        compatible_answer_ids = []
        for answer in answers:
            receiver_label = answer['resource']['label']
            connect_tab_senders = self.list_connect_tab_senders(receiver_label)
            if sender_label in connect_tab_senders:
                compatible_answer_ids.append(answer['answer_id'])

        return compatible_answer_ids


BCP0070302tests = BCP0070302AutoTest()
