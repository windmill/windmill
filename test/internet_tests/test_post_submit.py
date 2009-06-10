from windmill.authoring import WindmillTestClient

def test_post_submit():
    client = WindmillTestClient(__name__)
    client.open(url=u'http://tutorial.getwindmill.com/windmill-unittests/domain_switcher.html')
    client.type(text=u'simpletest', name=u'search_theme_form')
    client.click(name=u'op')
    client.waits.forPageLoad(timeout=20000)
    client.waits.forElement(xpath="//div[@id='squeeze']/h1", timeout=8000)
    client.asserts.assertJS(js=u"windmill.testWin().document.title == 'Search | drupal.org'")

def test_get_submit():
    client = WindmillTestClient(__name__)
    client.open(url=u'http://tutorial.getwindmill.com/windmill-unittests/domain_switcher.html')
    client.type(text=u'simpletest', name=u'q')
    client.click(name=u'btnG')
    client.waits.forPageLoad(timeout=20000)
    client.waits.forElement(link=u'SimpleTest - Unit Testing for PHP', timeout=u'8000')