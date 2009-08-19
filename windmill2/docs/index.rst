:mod:`windmill` --- Browser Automation Tool
===========================================

.. module:: windmill
   :synopsis: Browser Automation Tool.
.. moduleauthor:: Mikeal Rogers <mikeal.rogers@gmail.com>, Adam Christian <adam.christian@gmail.com>
.. sectionauthor:: Mikeal Rogers <mikeal.rogers@gmail.com>, Adam Christian <adam.christian@gmail.com>


:mod:`windmill.castile` --- Remote Object Representation and Event Serialization
================================================================================

.. module:: windmill.castile
   :synopsis: Remote Object Representation and Event Serialization.
.. moduleauthor:: Mikeal Rogers <mikeal.rogers@gmail.com>
.. sectionauthor:: Mikeal Rogers <mikeal.rogers@gmail.com>

Castile is a new and more dynamic way of providing communications between multiple endpoints. It avoids the blocking and bloat of SOAP and the one-way nature of RPC based systems while providing a flexible way to communicate and manipulate applications in different locations and programming languages.

Remote Object Representation
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Rather than the strictness of SOAP and RPC, ROR (Remote Object Representation) seeks to provide a way for one application to describe, interact, and manipulate foreign objects dynamically and in a more-or-less language neutral manner.

Event Bridging
^^^^^^^^^^^^^^

Instead of constantly polling for relevant information Castile provides mechanisms for different environments to serialize their event systems from one end to another. This allows us to provide fast and flexible asynchronous communication channels between various environments.

Node Based Event Propogation
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

In Windmill 1.0 we ran in to a problem. We have a Python environment and a JavaScript environment and the JavaScript environment is dependent on the Python environment to overcome security limitations in the browser. When we throw in another environment, say a Ruby or Java test api, that environment now has to communicate through the Python environment to talk to JavaScript. In traditional RPC systems this is a huge limitation, it means there is little flexibility in communication and events that have to be sent through the intermediary in rigid pre-defined ways.

:mod:`windmill.castile.events` --- Event Node Implementation
============================================================

.. module:: windmill.castile.events
   :synopsis: Event Node Implementation.
.. moduleauthor:: Mikeal Rogers <mikeal.rogers@gmail.com>
.. sectionauthor:: Mikeal Rogers <mikeal.rogers@gmail.com>

.. class:: EventNode(ns, events_uri)

   Castile Event Node.

   *ns* is the root namespace for this node. It must be unique between any peers
   it connects to or else bad things will happen.

   *events_uri* is the full public URI to this node once it is served over HTTP.

   .. method:: register_with_node(uri)

      Register this node with another remote node.

      *uri* is the full http uri to the remote event node.
	
   .. method:: add_listener(ns, func)

      Add a listener to the specified namespace.

      *ns* can be either a local or remote namespace, that logic is handled by
      the event node logic.

      *func* can be any callable that accepts a single argument, the event object.
      
   .. method:: fire_event(ns, obj)

      Fire an event. 

      *ns* should not include the node's namespace, this will get pre-pended before the 
      event is fired and propogated.   

      *obj* needs to be a dictionary that is JSON serializable. An additional value is 
      added before the event is propogated "event-type" which is the full namespace, 
      including the event node's namespace.

   .. method:: get_application()

      Get a :class:`CastileApplication` instance for this node instance.

      Returns a :class:`CastileApplication` instance which is a valid WSGI application.

   .. method:: get_cherrypy_server([host[, port[, server_name[, numthreads]]]])

      Gets a :class:`cherrypy.wsgiserver.CherryPyWSGIServer` server for the 
      :class:`CastileApplication` instance for this node.

      Server instance is returned and self.httpd is set to server.

      If port is ommitted the port of the events_uri is parsed and used.
      
   .. method:: start_cherrypy_server([host[, port[, server_name[, numthreads[, threaded]]]]])

      Calls get_cherrpy_server(), starts the server and then returns it.

      *threaded* defaults to True. If run threaded self.thread will be set to the 
      :class:`threading.Thread` instance


.. class:: EventApplication(events_node)

   Inherits from :class:`webenv.rest.RestApplication`.

   *events_node* is a :class:`EventNode` instance.

.. class:: ROR()

   Implements a node's Remote Object Representation registration and access API.

   An instance of this class is attached to each EventNode instance.

   .. method:: add_object(name, object)

      Adds *object* to a nodes registry so that it is exposed to other nodes as
      *name*.

          >>> from windmill2.events import EventNode
          >>> enode = EventNode()
          >>> module_dict = {}
          >>> enode.ror.add_object("mod_dict", module_dict)
          >>> enode.ror.get_object("mod_dict") == module_dict
          True


   .. method:: get_object(name)

      Get object in ROR registry of *name*.

Castile Protocol
================

This the primary API for Castile is an HTTP REST API. Other APIs like the Comet API are defined in terms of the REST API. 

New Castile Node implementations are expected to implement the Rest API and not the Comet *push* API used to overcome browser limitations for the JavaScript node. 

**/** is defined as the base Castile namespace. Nodes register with a URI that implements the Castile protocol beginning at **/**.

PUT /$eventName
^^^^^^^^^^^^^^^

**PUT** is used exclusively for firing Events

**BODY**  

   Any valid JSON object

The $eventName should begin with the namespace the node registered.

POST  /
^^^^^^^

**BODY**

.. code-block:: javascript  

   {'events-uri': 'http://localhost:8889/', 
   'event-node-type': 'http-rest-api', 
   'client-namespace':'node1'}

Register a new castile node.

POST /$clientNS/listeners
^^^^^^^^^^^^^^^^^^^^^^^^^

**BODY**  

.. code-block:: javascript

   {'namespace':'node2.ui'}

Adds a remote listener. A listener is subscribed to all the events in that namespace, so the above listener would receive and event name node2.ui.output.pass . Nodes are expected to send each event to subscribed nodes only once regardless of how many listeners they've attached.

GET /
^^^^^

Returns list of registered clients.

GET /$clientNS
^^^^^^^^^^^^^^

Returns the info object for that remote node.

GET /$clientNS/jsonstream
^^^^^^^^^^^^^^^^^^^^^^^^^

Returns a stream of JSON objects for clients the require this "push" solution, namely: JavaScript.

GET /$clientNS/listeners
^^^^^^^^^^^^^^^^^^^^^^^^

Returns a list of listeners for the given client.

GET /$clientNS/ror/describe/$objectName?depth=0
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Returns a description of the given objectName. Depth is a recursion in to that objects attributes.

POST /$clientNS/ror/callFunction/$objectName
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

**BODY** 

.. code-block:: javascript

   {"args":["asdf"], "kwargs":{"asdf":4}}

Calls the given function and returns a remote reference to the returned value.

POST /$clientNS/ror/createInstance/$objectName
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

**BODY** 

.. code-block:: javascript

   {"args":["asdf"], "kwargs":{"asdf":4}}

Create a new instance of a classobject and return a remote reference.

POST /$clientNS/ror/setAttribute/$objectName
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

**BODY** 

.. code-block:: javascript 

   {"attribute":"attr", "value":$obj, "reference":false}

Set "attribute" of $objectName to "value". If reference is true then "value" is a string containing an objectName for a foreign object on that client.

POST /$clientNS/ror/setItem/$objectName
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

**BODY** 

.. code-block:: javascript

   {"attribute":"attr", "value":$obj, "reference":false}

Set item "attribute" of $objectName to "value". If reference is true then "value" is a string containing an objectName for a foreign object on that client. This is for common array and hash syntax.
