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
import wx.grid as gridlib
import logging
import time

class CustomDataTable(gridlib.PyGridTableBase): 
    """A custom table used specifically for the windmill wxui"""
    def __init__(self): 
        gridlib.PyGridTableBase.__init__(self) 

        self.colLabels = ['Level', 'Time', 'Logger', 'Message'] 
        self.dataTypes = [gridlib.GRID_VALUE_STRING,
                          gridlib.GRID_VALUE_STRING, 
                          gridlib.GRID_VALUE_STRING,  
                          gridlib.GRID_VALUE_STRING ] 
        self.data = []
	
	self.previousSize = 0
        
    #-------------------------------------------------- 
    # required methods for the wxPyGridTableBase interface 
    def GetNumberRows(self): 
        return len(self.data) + 1 
    
    def GetNumberCols(self): 
        return len(self.colLabels)
    
    def IsEmptyCell(self, row, col): 
        try: 
            return not self.data[row][col] 
        except IndexError: 
            return True 

    # Get/Set values in the table.  The Python version of these 
    # methods can handle any data-type, (as long as the Editor and 
    # Renderer understands the type too,) not just strings as in the 
    # C++ version. 
    def GetValue(self, row, col): 
        try: 
            return self.data[row][col] 
        except IndexError: 
            return '' 
    
    def SetValue(self, row, col, value): 
        try: 
            self.data[row][col] = value 
        except IndexError: 
            # add a new row 
            self.data.append([''] * self.GetNumberCols()) 
            self.SetValue(row, col, value) 
            # tell the grid we've added a row 
            msg = gridlib.GridTableMessage(self,            # The table 
                    gridlib.GRIDTABLE_NOTIFY_ROWS_APPENDED, # what we did to it 
                    1                                       # how many 
                    ) 
            self.GetView().ProcessTableMessage(msg) 

    #-------------------------------------------------- 
    # Some optional methods 
    # Called when the grid needs to display labels 
    def GetColLabelValue(self, col): 
        return self.colLabels[col] 

    # Called to determine the kind of editor/renderer to use by 
    # default, doesn't necessarily have to be the same type used 
    # natively by the editor/renderer if they know how to convert. 
    def GetTypeName(self, row, col): 
        return self.dataTypes[col] 

    # Called to determine how the data can be fetched and stored by the 
    # editor and renderer.  This allows you to enforce some type-safety 
    # in the grid. 
    def CanGetValueAs(self, row, col, typeName): 
        colType = self.dataTypes[col].split(':')[0] 
        if typeName == colType: 
            return True 
        else: 
            return False 

    def CanSetValueAs(self, row, col, typeName): 
        return self.CanGetValueAs(row, col, typeName) 
    
    def DeleteRows(self, pos = 0, numRows = 0):
	try:
	    if len(self.data) != 0 and len(self.data) < pos+numRows:
		del self.data[pos:pos+numRows]
		
		## tell the grid we've added a row 
		msg = gridlib.GridTableMessage(self,            # The table
			gridlib.GRIDTABLE_NOTIFY_ROWS_DELETED, # what we did to it 
			pos,
			numRows# how many 
			) 
		self.GetView().ProcessTableMessage(msg)
	except Exception:
	    print "\nERROR IN DELETEROWS\n"
	    return False
	
	return True
	    
    def AppendNewRow(self, values):
        """Sets a row to a value"""
        
        self.data.append(values) 
    
        ## tell the grid we've added a row 
        msg = gridlib.GridTableMessage(self,            # The table 
                gridlib.GRIDTABLE_NOTIFY_ROWS_APPENDED, # what we did to it 
                1                                       # how many 
                ) 
        self.GetView().ProcessTableMessage(msg)

    def AppendRows(self, numRows = 1):
        """Sets a row to a value"""

	## tell the grid we've added a row 
        msg = gridlib.GridTableMessage(self,            # The table 
                gridlib.GRIDTABLE_NOTIFY_ROWS_APPENDED, # what we did to it 
                numRows                                       # how many 
                )
	
        self.GetView().ProcessTableMessage(msg)

    def GetRow(self, row):
        """Gets a row with the given index"""
        try:
            return self.data[row]
        except IndexError:
            print "Row not part of database"
        
    def ChangeDataSet(self, nwlst):
	#assign a value to retain the current length of the data list
	previousSize = len(self.data)
	
	#reassign the data list
	self.data = list(nwlst)
	
	#call the function to resize the number of rows if necessary
	self.ResizeTableRows(len(self.data), previousSize)
	
    def ResizeTableRows(self, now, prev):
	try:
	    if now - prev > 0: # need to adds some rows
		## tell the grid we've added a row 
		msg = gridlib.GridTableMessage(self,            # The table
					       gridlib.GRIDTABLE_NOTIFY_ROWS_APPENDED, # what we did to it 
					       now - prev       # how many 
					       ) 
		self.GetView().ProcessTableMessage(msg)
	    elif now - prev < 0: # need to delete empty rows
		## tell the grid we've added a row 
		msg = gridlib.GridTableMessage(self,            # The table
					       gridlib.GRIDTABLE_NOTIFY_ROWS_DELETED, # what we did to it 
					       0,
					       prev - now        # how many 
					   ) 
		self.GetView().ProcessTableMessage(msg)
	    else:
		return

	except wx._core.PyAssertionError:
	    return
	    
#--------------------------------------------------------------------------- 
class CustTableGrid(gridlib.Grid, logging.Handler): 
    def __init__(self, parent): 
        gridlib.Grid.__init__(self, parent, -1) 
        
        logging.Handler.__init__(self)        

        table = CustomDataTable() 
        
        self.masterList = []
	
        #determines the last column sorted
        self.lastSorted = [1, True] 

        #make the text in each cell wrap to fit within the width of each cell.
        self.SetDefaultRenderer(wx.grid.GridCellAutoWrapStringRenderer())
        
        # The second parameter means that the grid is to take ownership of the 
        # table and will destroy it when done.  Otherwise you would need to keep 
        # a reference to it and call it's Destroy method later. 
        self.SetTable(table, True) 
        
        #assign the second column to 150 width STATIC VALUE. MUST CHANGE
	self.SetColSize(2, 150)
	self.SetColSize(1, 100)
	
	#insure left side label is not displayed
        self.SetRowLabelSize(0) 

	#remove the extra space after the last column
        self.SetScrollLineX(1)

        #disable the editing of cells
        #self.EnableEditing(True)
	#self.EnableCellEditControl(True)        
	
        #Set the default alignment of the cells values
        self.SetDefaultCellAlignment(wx.ALIGN_LEFT, wx.ALIGN_CENTER)

        self.currentSearchValue = ""
        
        self.EnableDragColSize(False)

	##define the events to be used on the control##
        
        #Onsize for resizing the message column
        self.Bind(wx.EVT_SIZE, self.OnSize)
        
        #on column double click sorting values
        self.Bind(gridlib.EVT_GRID_LABEL_LEFT_DCLICK, self.SortSpecificColumn)
	
	#Handle when the data in a cell changes by changing it's color appropriately
	self.Bind(gridlib.EVT_GRID_CELL_CHANGE, self.EvtCellChange)

	#Handle when the data in a cell changes by changing it's color appropriately
	self.Bind(gridlib.EVT_GRID_CMD_SELECT_CELL, self.EvtCellChange)

    def emit(self, record):
	#parse the record into a list format that fits to the table
	lstItem = self.ParseRecordToList(record)

	#append the new item to the master list
	self.masterList.append(lstItem)
	
	#determine if the record should be place in the table
	if( record.getMessage().find(self.currentSearchValue) is not -1):
	    self.GetTable().AppendNewRow(lstItem)
	    self.SortColumn()

	    ##because of crashing purposes must call autesizerows less often, so i'm callin only every 5 times
	    #if(self.GetTable().GetNumberRows() % 7 == 0 ):
		#self.AutoSizeRows(False)
		
    def SearchValues(self, searchValue):

	#print "The search value is: ", searchValue, " and the len of data is: ", len(self.GetTable().data)
	if searchValue == "":
	    self.GetTable().ChangeDataSet(self.masterList)	    

	# determine if this is a new search value
	elif(len(searchValue) > len(self.currentSearchValue)): # addition to current search
	    ##search currently active list
	    self.GetTable().ChangeDataSet(filter(lambda lst: lst[self.GetNumberCols()-1].find(searchValue) is not -1, self.GetTable().data))
			    
	else:
	    #search master list
	    self.GetTable().ChangeDataSet(filter(lambda lst: lst[self.GetNumberCols()-1].find(searchValue) is not -1, self.masterList))
	
	#reassign currentSearchValue
	self.currentSearchValue = searchValue

	self.SortColumn()
	self.AutoSizeRows(False)
	
    def ParseRecordToList(self, record):
	#retrieve the record time
	recordTime = time.strftime("%H:%M:%S.", time.gmtime(record.created)) + (lambda x: x[x.rfind(".")+1:] )(str(record.created))

	#append the new record into the master list
	return [str(record.levelname), recordTime, record.name, str(record.getMessage())]
			
	
    def OnSize(self, event):
        """handles a window resize"""
	event.Skip()
        
        #determine the width of the last column to the edge of the screen
        totalSize = 0
        
        for cell in range(0, self.GetNumberCols() -1):
            totalSize += self.GetColSize(cell)
        #print "The scrollbar pos is: ", self.Parent.GetScrollBar(wx.HORIZONTAL)
        self.SetColSize(self.GetNumberCols() -1, event.Size[0] - totalSize - 15)        
        
        self.AutoSizeRows(True)

    
    def SortSpecificColumn(self, event):
        if self.lastSorted[0] == event.Col:
            self.lastSorted[1] = not(self.lastSorted[1])
        else:
            self.lastSorted[0] = event.Col
            self.lastSorted[1] = False

        self.SortColumn(event.Col, self.lastSorted[1])
	self.AutoSizeRows(False)
        
    def SortColumn(self, col = None, reverse = False):
	if( len(self.GetTable().data) is not 0):
	    if col is None:
		self.GetTable().data.sort(key=lambda lst: lst[self.lastSorted[0]], reverse=self.lastSorted[1])
	    else:
		self.GetTable().data.sort(key=lambda lst: lst[col], reverse=reverse)

	    #self.AutoSizeRows(False)
	    self.ForceRefresh()

    def EvtCellChange(self, event):
	"""Handle cell change event"""
	#print "Cell changed at: ", event.GetCol(), ", ", event.GetRow()
	#if(event.GetCol() == 0):
	    #self.SetRowAttr(event.GetRow(), gridlib.GridCellAttr(colText = wx.GREEN))

    def __del__(self):
        self.close()   