HC= harp compile

#-------------------------------------------------------------------------------
all: index.html


index.html: _harp/index.index.jade
	$(HC) _harp .
