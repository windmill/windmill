import os, sys
import tempfile
from distutils import dir_util
copytree = dir_util.copy_tree

this_dir = os.path.abspath(os.path.dirname(__file__))
windmill_dir = os.path.abspath(os.path.dirname(this_dir))

def create_extension():
    t = tempfile.mkdtemp(prefix='windmill2.')
    copytree(os.path.join(this_dir, 'extension'), t)
    copytree(os.path.join(windmill_dir, 'castile', 'js'), os.path.join(t, 'resource', 'castile'))
    return t
