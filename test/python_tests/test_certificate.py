import os
import sys

from tempfile import mkstemp
from OpenSSL.crypto import load_certificate, FILETYPE_PEM, load_privatekey
from OpenSSL.crypto import dump_privatekey

from windmill.server.certificate import CertificateCreator
from windmill.server.certificate import SSLCertificateForHost


class TestSSLCertificateForHost(object):

    def setup(self):
        cc = CertificateCreator()
        self.cert_for_host = SSLCertificateForHost(cc, 'www.example.com:443')
        self.cert_data = open(self.cert_for_host.certfile).read()

    def teardown(self):
        if os.path.exists(self.cert_for_host.certfile):
            os.unlink(self.cert_for_host.certfile)

    def test_certfile_contains_certificate(self):
        cert = load_certificate(FILETYPE_PEM, self.cert_data)

        assert cert.get_subject().commonName == 'www.example.com'

    def test_certfile_contains_privatekey(self):
        key = load_privatekey(FILETYPE_PEM, self.cert_data)

        assert key.type() == CertificateCreator.default_key_type
        assert key.bits() == CertificateCreator.default_key_bits


class TestCertificateCreator(object):

    def setup(self):
        self.cc = CertificateCreator()

    def test_cert_for_host_has_proper_common_name(self):
        cert = self.cc['www.example.com'].cert
        name = cert.get_subject()

        assert name.commonName == 'www.example.com'

    def test_cert_for_host_returns_same_cert_for_same_host(self):
        c1 = self.cc['www.example.com'].cert
        c2 = self.cc['www.example.com'].cert

        assert c1.digest('md5') == c2.digest('md5')

    def test_certfile_contains_key(self):
        path = self.cc['www.example.com'].certfile

        assert os.path.exists(path)
        # Check key path can be successfully loaded as private key and doesn't
        # requires password, lambda is for case where password is required
        load_privatekey(FILETYPE_PEM, open(path).read(), lambda: "")


