#   Copyright (c) 2007 Open Source Applications Foundation
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

import wx

class PrefDialog(wx.Dialog):
    """Frame that displays the Main window"""

    def __init__(self, parent=None, id=-1, pos=wx.DefaultPosition, title='Preferences', preferences = {}, **kwargs):
        
        ##initialize the frame
        wx.Dialog.__init__(self, parent, id, title, pos, size=(500, 185), **kwargs)
        
        self.preferences = preferences
        
        self.setupDisplay()


    def setupDisplay(self):
        """Setups the display for the screen"""
        self.displayGridSizer = wx.GridBagSizer(3, 8)
        
        self.displayPanel = wx.Panel(self, -1)
        
        index = 1
        #The Default URL Option
        self.displayGridSizer.Add( wx.StaticText(self.displayPanel, -1, 
                                                 "  Default URL:   ", 
                                                 style=wx.ALIGN_LEFT), (index,0) )

	self.testUrl = wx.TextCtrl(self.displayPanel, -1, str(self.preferences['TEST_URL']))
	#get the url from the preferences file or use a default
	self.displayGridSizer.Add( self.testUrl, (index,1), (1,5), flag=wx.EXPAND )
        
        ##Mozilla Profile location
	self.displayGridSizer.Add( wx.StaticText(self.displayPanel, -1, 
                                                 "  Mozilla Profile location:   ", 
                                                 style=wx.ALIGN_LEFT), (index+1,0) )
        
        self.mozillaProfLoc = wx.TextCtrl(self.displayPanel, -1, str(self.preferences['MOZILLA_DEFAULT_PROFILE']))
        self.displayGridSizer.Add( self.mozillaProfLoc, (index+1,1), (1,5), flag=wx.EXPAND )
        
        ##Service Port
        self.displayGridSizer.Add( wx.StaticText(self.displayPanel, -1, 
                                                 "  Service Port:   ", 
                                                 style=wx.ALIGN_LEFT), (index+2,0) )
        
        self.servicePort = wx.TextCtrl(self.displayPanel, -1, str(self.preferences['SERVER_HTTP_PORT']))
        self.displayGridSizer.Add( self.servicePort, (index+2,1), flag=wx.EXPAND )        

        ##creat the save and cancel buttons
        saveButton = wx.Button(self.displayPanel, -1, "OK")
        cancelButton = wx.Button(self.displayPanel, -1, "Cancel")
        
        self.displayGridSizer.Add( saveButton, (index+4, 1))
        self.displayGridSizer.Add( cancelButton, (index+4, 2))
        
        self.Bind(wx.EVT_BUTTON, self.OnCancelButton, cancelButton)
        self.Bind(wx.EVT_BUTTON, self.OnSaveButton, saveButton)        
        
        self.displayPanel.SetSizerAndFit(self.displayGridSizer)

    def GrabNewPreferences(self):

	self.preferences['TEST_URL'] = self.testUrl.Value
	
	self.preferences['MOZILLA_DEFAULT_PROFILE'] = self.mozillaProfLoc.Value
	
	self.preferences['SERVER_HTTP_PORT'] = int(self.servicePort.Value)
	
    def OnCancelButton(self, event):
        """Handle a cancel button"""
	self.EndModal(wx.ID_CANCEL)
        
    def OnSaveButton(self, event):
        """Handle a save button action"""
	self.GrabNewPreferences()
        self.EndModal(wx.ID_OK)
                
class Apple(wx.App):
    def OnInit(self):
        frame = Dialog()
        frame.ShowModal()
        self.SetTopWindow(frame)
        return True

if __name__ == '__main__':
    app = Apple(False)
    app.MainLoop()