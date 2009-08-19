
import simplejson

class RemoteObjectException(Exception): pass
class RemoteObjectDoesNotExist(RemoteObjectException): pass

def create_remote(client, name, description=None):
    if description is None:
        description = client.describe(name)
        
    if description.has_key('exception'):
        raise RemoteObjectDoesNotExist(description)
    
    if description['type'] == 'null':
        return None
    elif description['type'] in ['int', 'float', 'string']:
        obj = ror_type_cases[description['type']](description['value'])
        obj._client_ = client
        obj._desciption_ = description
        obj._value_ = description['value']
        obj._name_ = description['name']
        return obj
    else:
        return RemoteObject(client, name, description)

def NaN(x):
    try:
        int(x)
        return False
    except:
        return True

class RemoteObject(object):
    """Base remote object representation."""
        
    def __init__(self, client, name, description, value=None):
        self._loaded_ = False
        self._client_ = client
        self._name_ = name
        self._description_ = description
        self._value_ = value
    
    def __remotegettr__(self, name, description=None):
        """Abstraction for final step in get events; __getitem__ and __getattr__.
        """
        result = create_remote(self._client_, self._name_+'.'+name, description)
        return result
    
    def __getattr__(self, name):
        """Get the object from jsbridge. 
        
        Handles lazy loading of all attributes of self."""
        # A little hack so that ipython returns all the names.
        if name == '_getAttributeNames':
            return lambda : [a['name'] for a in self._client_.describe(self._name_+'.'+name, depth=1)['attributes']]
            
        return self.__remotegettr__(name)
        
    def __getitem__(self, name, description=None):
        result = create_remote(self._client_, self._name_+'['+simplejson.dumps(name)+']', description)
        return result
        
        
    def __setattr__(self, name, value, reference=False):
        if name.startswith('_'):
            return object.__setattr__(self, name, value)
        if type(value) is RemoteObject or issubclass(type(value), RemoteObject):
            reference = True
            value = value._name_
        self._client_.setAttribute(self._name_, name, value, reference)
    
    def __setitem__(self, name, value, reference=False):
        if type(value) is RemoteObject or issubclass(type(value), RemoteObject):
            reference = True
            value = value._name_
        self._client_.setItem(self._name_, name, value, reference)
        
    def __cmp__(self, obj):
        description = self._client_.describe(self._name_, depth=1)
        if type(obj) in [list, tuple]:
            if len(self) != len(obj):
                return False
            for x in range(len(obj)):
                if self[x] != obj[x]:
                    return False
        elif type(obj) is dict:
            if len(self) != len(obj):
                return False
            for x in obj.keys():
                if self[x] != obj[x]:
                    return False
        elif type(obj) not in [int, float, None]:
            for x in self._getAttributeNames():
                if getattr(self, x) != getattr(obj, x):
                    return False
        elif hasattr(self, '__btype__'):
            return self.__btype__.__cmp__(self, obj)
        return object.__cmp__(self, obj)
    
    def __len__(self):
        description = self._client_.describe(self._name_, depth=1)
        if description.has_key('length'):
            return description['length']
        elif description.has_key('attributes'):
            return len(attributes)
        else:
            return 0

    def __call__(self, *args, **kwargs):
        if self._description_['type'] == 'function':
            response = self._client_.callFunction(self._name_, args, kwargs)
        elif self._description_['type'] == 'classobj':
            response = self._client_.createInstance(self._name_, args, kwargs)
        else:
            raise Exception('This object is not callable')

        if response.has_key('exception'):
            raise RemoteObjectException(response['exception'])
        else:
            return create_remote(self._client_, response['name'], response)

class RemoteString(RemoteObject, unicode):
    "Javascript string representation."
    __init__ = unicode.__init__
    __btype__ = unicode

class RemoteInt(RemoteObject, int): 
    """Javascript number representation for Python int."""
    __init__ = int.__init__
    __btype__ = int

class RemoteFloat(RemoteObject, float):
    """Javascript number representation for Python float."""
    __init__ = float.__init__
    __btype__ = float

ror_type_cases = {'int'       :RemoteInt,
                  'float'     :RemoteFloat,
                  'string'    :RemoteString,
                  }




