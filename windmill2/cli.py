# from optparse import OptionParser
# 
# options = [
#     ("-f", "--logfile", dest="logfile", help="Write log to logfilel",),
#     ("-c", "--nocompress", dest="compress", default=True, action="store_false",),
#     ]
#     
# def start_firefox():
#     pass    
#     
# args = {
#     'firefox':start_firefox,
#     }
# 
# def main():
#     parser = OptionParser()
#     for args in options:
#         parser.add_option(*args)
# 
#     (options, args) = parser.parse_args()

# import os, sys
# import tempfile
# 
# import jsbridge
# from jsbridge import global_settings
# 
# this_dir = os.path.abspath(os.path.dirname(__file__))
# 
# from distutils import dir_util
# copytree = dir_util.copy_tree
from browser import firefox
import mozrunner

def main():
    # from browser import firefox
    # sys.argv.append('--launch')
    # d = firefox.create_extension()
    # global_settings.MOZILLA_PLUGINS.append(d)
    # jsbridge.cli(shell=False)  
    CLI().run()
    

class CLI(mozrunner.CLI):
    def get_profile(self, *args, **kwargs):
        profile = super(CLI, self).get_profile(*args, **kwargs)
        d = firefox.create_extension()
        profile.install_plugin(d)
        return profile
    
    
if __name__ == "__main__":
    main()






