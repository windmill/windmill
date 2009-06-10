from windmill.authoring import WindmillTestClient

def test_post_submit():
    client = WindmillTestClient(__name__)
    client.open(url='/windmill-unittests/static/frames.html')
    client.waits.forPageLoad(timeout=20000)
    client.click(link="Open page in bottom frame")
    client.asserts.assertText(validator='Success', id='result')
    client.asserts.assertText(validator='Should still be here', id='control')

