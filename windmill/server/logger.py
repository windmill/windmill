#   Copyright (c) 2006-2007Open Source Applications Foundation
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

import logging

def setup_root_logger(console_level=logging.NOTSET, file_level=logging.NOTSET, 
                      file_obj=None):
    """Setup the root logger, console_level and file_level must be levels from the logging module"""
    # Set global level to 0 so we can catch anything with our handlers
    logging.getLogger().setLevel(0)
    
    if file_obj is not None:
        logging.basicConfig(level=file_level,
                            format='%(asctime)s %(name)-12s %(levelname)-8s %(message)s',
                            datefmt='%m-%d %H:%M',
                            stream=file_obj)
    
    console = logging.StreamHandler()
    console.setLevel(console_level)
    formatter = logging.Formatter('%(name)-12s: %(levelname)-8s %(message)s')
    console.setFormatter(formatter)
    
    logging.getLogger('').addHandler(console)
    return console
    
def setup_individual_logger(name, level=logging.NOTSET):
    
    logger = logging.getLogger(name)
    logger.setLevel(0)
    return logger
    