## sgModalService

The library is into the lib directory.

The sample can be run on Firefox or running the following commands from this directory

* If you have Python 2.x: python -m SimpleHTTPServer 8000
* If you have Python 3.x: python -m http.server 8000
* If you have Perl:
	* cpan HTTP::Server::Brick   # install dependency
	* perl -MHTTP::Server::Brick -e '$s=HTTP::Server::Brick->new(port=>8000); $s->mount("/"=>{path=>"."}); $s->start'
* If you are under windows: "C:\Program Files (x86)\IIS Express\iisexpress.exe" /path:%CD% /port:8000

	NOTE: To use the dialog service is only needed to look into /app/commn, copy the style.css and dialog.html,
	taking the javascript identified by "MODAL DIALOG SERVICE BEGIN"!!