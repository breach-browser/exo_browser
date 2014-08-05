// Copyright (c) 2014 Stanislas Polu.
// Copyright (c) 2012 The Chromium Authors.
// See the LICENSE file.

#include "src/net/net_log.h"

#include <stdio.h>

#include "base/command_line.h"
#include "base/files/file_path.h"
#include "base/values.h"
#include "content/public/common/content_switches.h"
#include "net/base/net_log_logger.h"

namespace exo_shell {

namespace {

base::DictionaryValue* 
GetExoShellConstants() 
{
  base::DictionaryValue* constants_dict = net::NetLogLogger::GetConstants();

  // Add a dictionary with client information
  base::DictionaryValue* dict = new base::DictionaryValue();

  dict->SetString("name", "exo_shell");
  dict->SetString("command_line",
                  CommandLine::ForCurrentProcess()->GetCommandLineString());
  constants_dict->Set("clientInfo", dict);

  return constants_dict;
}

}  // namespace

ExoShellNetLog::ExoShellNetLog() 
{
  const CommandLine* command_line = CommandLine::ForCurrentProcess();

  if (command_line->HasSwitch(switches::kLogNetLog)) {
    base::FilePath log_path =
        command_line->GetSwitchValuePath(switches::kLogNetLog);
    // Much like logging.h, bypass threading restrictions by using fopen
    // directly.  Have to write on a thread that's shutdown to handle events on
    // shutdown properly, and posting events to another thread as they occur
    // would result in an unbounded buffer size, so not much can be gained by
    // doing this on another thread.  It's only used when debugging, so
    // performance is not a big concern.
    FILE* file = NULL;
#if defined(OS_WIN)
    file = _wfopen(log_path.value().c_str(), L"w");
#elif defined(OS_POSIX)
    file = fopen(log_path.value().c_str(), "w");
#endif

    if (file == NULL) {
      LOG(ERROR) << "Could not open file " << log_path.value()
                 << " for net logging";
    } else {
      scoped_ptr<base::Value> constants(GetExoShellConstants());
      net_log_logger_.reset(new net::NetLogLogger(file, *constants));
      net_log_logger_->StartObserving(this);
    }
  }
}

ExoShellNetLog::~ExoShellNetLog() 
{
  // Remove the observer we own before we're destroyed.
  if (net_log_logger_)
    RemoveThreadSafeObserver(net_log_logger_.get());
}

} // namespace exo_shell
