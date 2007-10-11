from windmill.authoring import WindmillTestClient

def test_google_1():
    client = WindmillTestClient(__name__)
    client.waits.forElement(xpath=u'html/body/center/p/font', timeout=u'3000')
    client.asserts.assertValue(validator=u'Google Search', name=u'btnG')
    client.asserts.assertValue(validator=u"I'm Feeling Lucky", name=u'btnI')
    client.asserts.ImageLoaded(xpath=u'html/body/center/img')
    
def test_google_2():
    client = WindmillTestClient(__name__)
    client.asserts.assertImageLoaded(xpath=u'html/body/center/img')
    