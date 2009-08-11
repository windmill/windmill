#!/usr/bin/env python

import optparse
import os
import re
import shutil
import time

# Location of the compiler
MXMLC_PATH = '/Users/mde/flex_sdk_3/bin/mxmlc'
# Assume we're compiling in the current dir
# TODO: parameterize this
SOURCE_PATH = '.'
# Ignore imports of these namespaces
IGNORED_TOPLEVELS = ["adobe", "flash", "fl", "mx"]
# Pattern to remove comments before looking for import
# statements
singleline_comments_re = re.compile(
	'//.*?(\n|\r)', re.MULTILINE)
multiline_comments_re = re.compile(
	'/\*(.|\n|\r)*?\*/', re.MULTILINE)
# Pattern for pulling out all the import statements
# in a .as file
import_re = re.compile(
	'(?:^import|\s+import)(?:\s+)(\S+)(?:\s*;)',
	  re.MULTILINE)
# For replacing .as with .swf
as_re = re.compile('\.as$|\.mxml$')
# List of file items -- key is the path, value is
# one of the FileObj items below
files = {}
# Script options
opts = None

class FileObj:
	def __init__(self, path):
			# The full file path from the currect
			# directory, e.g. ./some/path/to/file.as
			self.path = path
			# List of .as files this file depends on
			self.imports = []
			# List of .as files that import this file
			self.imported_by = []
			# Needs to be compiled (.as file mod date
			# is newer than the .swf file date)
			self.dirty = False
			# Flag used by the parser to avoid descending
			# into already-covered areas of the tree
			self.dirty_set = False
			# Flag used by the compile step to avoid
			# compiling the same file multiple times
			self.compiled = False

def get_files(dirname=None, incl_mxml=True):
	'''Get a list of all the .as files under the
	current directory
	'''
	if dirname is None:
		dirname = opts.dirname
	filename = opts.filename
	if dirname:
		for root, dirs, file_list in os.walk(dirname):
				for file in file_list:
					if file.endswith('.as') or (incl_mxml and
							file.endswith('.mxml')):
						path = root + '/' + file
						files[path] = FileObj(path)
	elif filename:
		files[filename] = FileObj(filename)
		# If this is an mxml file, it implicitly imports
		# all .as files in the same directory
		if filename.endswith('.mxml'):
			path_arr = filename.split('/')
			path_arr.pop()
			mxml_dir = '/'.join(path_arr)
			get_files(mxml_dir, False)
	else:
		print 'No filename or directory specified.'

def flag_dirty_and_parse_for_imports():
	'''Does two things:
	1. Sets the dirty flag on every file where the
	.as file mod date is newer than the .swf file
	2. Parses the file contents to build a list
	of files it imports
	'''
	found_dirty = False
	for key in files.keys():
			dirty = False
			file = files[key]
			swf_file = as_re.sub('.swf', key)
			as_mod = os.stat(key).st_mtime
			# If there's no corresponding SWF file,
			# or the SWF file is older than the AS file,
			# it's a dirty, dirty file ...
			if os.path.isfile(swf_file):
					swf_mod = os.stat(swf_file).st_mtime
					if as_mod > swf_mod:
							dirty = True
			else:
					dirty = True
			if dirty:
					file.dirty = True
					found_dirty = True
			parse_file_for_imports(file)
	return found_dirty

def parse_file_for_imports(file):
	  '''Parse file contents to build a list of files
	  this file imports.
	  NOTE: the add_import step also add the reverse
	  mapping for files that import this file.
	  '''
	  h = open(file.path, 'r')
	  text = h.read()
	  h.close()
	  text = singleline_comments_re.sub('', text)
	  text = multiline_comments_re.sub('', text)
	  matches = import_re.findall(text)
	  for match in matches:
			# Ignore all the built-in top-level packages
	      is_top = False
	      for top in IGNORED_TOPLEVELS:
	          if match.startswith(top):
	              is_top = True
	      if not is_top:
					path = './' + match.replace('.', '/')
					# Handle wildcard imports
					if path.endswith('*'):
							path = path.replace('/*', '')
							for f in os.listdir(path):
									if f.endswith('as') and not re.search('/' + f + '$', file.path):
											import_file = path + '/' + f
											add_import(file, import_file)
					# Single-package imports
					else:
							import_file = path + '.as'
							add_import(file, import_file)

def add_import(file, import_file):
	  '''1. Add an entry in this file for this import file
	  2. Go look up the entry for the file that's being imported
	  and add the reverse mapping in its imported_by list as well
	  '''
	  file.imports.append(import_file)
	  if import_file in files:
	      files[import_file].imported_by.append(file.path)
	  else:
	      print 'Error: ' + import_file + ' is not a file.'

def flag_files_that_import_dirty():
	  '''Walk through the list of files, set all files that
	  import dirty files as dirty as well. Use the dirty_set
	  flag to avoid desending into areas of the included_by
	  tree we've already been.
	  '''
	  for key in files.keys():
	      file = files[key]
	      if file.dirty and not file.dirty_set:
	          dirty_file(file) # Hand off to recursive func

def dirty_file(file):
	  '''Called for files that include a dirty file. Called
	  recursively on any files that include them, etc.
	  Relies on dirty_set flag to avoid repeat performances
	  '''
	  for imp_by in file.imported_by:
	      f = files[imp_by]
	      if not f.dirty_set:
	          dirty_file(f)
	  file.dirty_set = True
	  file.dirty = True

def compile_all_dirty(file=None):
	'''Recursively compile all the dirty files and any
	dirty files they include -- note it recurses into deps
	before the compile step so it happens correctly from the
	bottom up. Uses compiled flag so stuff only compiles once.
	'''
	# file passed, we're recursing -- get the list
	# for this file
	if file:
			file_list = file.imports
	# No file passed, initial call -- the list
	# is all the keys in files
	else:
			file_list = files.keys()
	# Recurse through dependencies to compile them
	# before compiling this guy
	for f in file_list:
			if f in files:
					if files[f].dirty and not files[f].compiled:
							compile_all_dirty(files[f])
	# Compile step
	if file:
			as_file = file.path
			swf_file = as_re.sub('.swf', as_file)
			print 'Compiling ' + as_file
			# Compile this biyatch
			# -----------------------
			cmd = MXMLC_PATH + ' -source-path=' + SOURCE_PATH + ' ' + as_file + ' -o ' + swf_file
			print cmd
			os.system(cmd)
			# -----------------------
			# Only ever do this once
			file.compiled = True

def parse_opts():
	parser = optparse.OptionParser()
	parser.add_option('-a', '--action', dest='action',
			help='perform ACTION (compile/clean, default is compile)',
			metavar='ACTION', choices=('compile', 'clean'), default='compile')
	parser.add_option('-f', '--file', dest='filename',
			help='compile/clean FILE and all its imports', metavar='FILE')
	parser.add_option('-d', '--directory', dest='dirname',
			help='compile/clean everything in DIR (default is the current dir (.))',
			metavar='DIR')
	opts, args = parser.parse_args()
	if opts.filename and opts.dirname:
		parser.error('Please choose either a file or a directory, not both.')
	elif not (opts.filename or opts.dirname):
		opts.dirname = '.'
	return opts, args

def main(o, a):
	global opts
	opts = o
	if opts.action == 'compile':
		compile()
	elif opts.action == 'clean':
		clean()
	else:
		print 'Not a valid action.'

def compile():
	get_files()
	found_dirty = flag_dirty_and_parse_for_imports()
	if found_dirty:
			flag_files_that_import_dirty()
			print 'Compile this biyatch ...'
			compile_all_dirty()
	else:
			print 'No dirty files, nothing to complile.'

def clean(dirname=None):
	if dirname is None:
		dirname = opts.dirname
	filename = opts.filename
	if dirname:
		for root, dirs, file_list in os.walk(dirname):
				for file in file_list:
					if file.endswith('.swf'):
						path = root + '/' + file
						cmd = 'rm ' + path
						print cmd
						os.system(cmd)
	elif filename:
		# If this is an mxml file, it implicitly imports
		# all .as files in the same directory
		if filename.endswith('.mxml'):
			path_arr = filename.split('/')
			path_arr.pop()
			mxml_dir = '/'.join(path_arr)
			clean(mxml_dir)
		elif filename.endswith('.swf'):
			cmd = 'rm ' + filename
			print cmd
			os.system(cmd)
	else:
		print 'No filename or directory specified.'

if __name__ == "__main__":
	main(*parse_opts())


