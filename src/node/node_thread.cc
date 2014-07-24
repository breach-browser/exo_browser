// Copyright (c) 2014 Stanislas Polu.
// See the LICENSE file.

#include "exo_browser/src/node/node_thread.h"

#include "content/public/browser/browser_thread.h"
#include "third_party/node/src/node.h"
#include "third_party/node/src/force_modules.h"
#include "base/file_util.h"
#include "base/command_line.h"
#include "base/time/time.h"
#include "exo_browser/src/common/switches.h"
#include "exo_browser/src/node/api/api_bindings.h"

using v8::Isolate;
using v8::HandleScope;
using v8::Local;
using v8::Locker;
using v8::Context;
using v8::Object;
using v8::V8;
using v8::Value;
using v8::Script;
using v8::String;
using v8::RegisterExtension;
using node::Environment;

using namespace content;

namespace exo_browser {

namespace {

void
uv_dummy_cb(
    uv_async_t* handle)
{
  /* Nothin to Do: This callback is used to yeield the thread to the original */
  /* message loop when locked in the `uv_run_loop` call.                      */
}

base::FilePath GetSelfPath() {
  CommandLine* command_line = CommandLine::ForCurrentProcess();

  base::FilePath path;

  size_t size = 2 * PATH_MAX;
  char* execPath = (char*)malloc(size);
  //char* execPath = new char[size];
  if (uv_exepath(execPath, &size) == 0) {
    path = base::FilePath::FromUTF8Unsafe(std::string(execPath, size));
  } else {
    path = base::FilePath(command_line->GetProgram());
  }


  return path;
}

}

NodeThread*
NodeThread::Get()
{
  static NodeThread* s_thread = NULL; 
  if(s_thread == NULL) {
    s_thread = new NodeThread();
  }
  return s_thread;
}

NodeThread::NodeThread()
: Thread("node_wrapper_thread")
{
  uv_async_init(uv_default_loop(), &uv_dummy, uv_dummy_cb);
}

NodeThread::~NodeThread()
{
  /* All Thread subclasses must call Stop() in the destructor */
  Stop();
}

void 
NodeThread::Init() 
{
  message_loop()->PostTask(FROM_HERE,
                           base::Bind(&NodeThread::RunUvLoop,
                                      base::Unretained(this)));
}

void 
NodeThread::Run(
    base::MessageLoop* message_loop) 
{
  const CommandLine* command_line = CommandLine::ForCurrentProcess();

  base::FilePath path = GetSelfPath().DirName();
#if defined(OS_MACOSX)
  /* TODO(spolu): correct base path */
  path = path.DirName().Append("Resources");
#endif

  std::vector<std::string> args_vector;

  if(command_line->HasSwitch(switches::kExoBrowserRaw)) {
    /* Extract argc, argv to pass it directly to Node */
    const int argc = command_line->argv().size() - 1;
    for(int i = 0; i < argc + 1; i ++) { 
      if(command_line->argv()[i] != "--raw") {
        args_vector.push_back(command_line->argv()[i]);
      }
    }
  }
  else {
    /* Build Default 'shell/' arguments */
    std::string shell_path = path.AsUTF8Unsafe() + "/" + EXO_BROWSER_SHELL_CODE;
    args_vector.push_back(command_line->argv()[0]);
    args_vector.push_back(shell_path);
  }

  // Hack around with the argv pointer. Used for process.title = "blah".
  std::vector<char*> _args;
  _args.reserve(args_vector.size());
  for(unsigned int i = 0; i < args_vector.size(); ++i)
    _args.push_back(&args_vector[i][0]);

  int argc = _args.size();
  const char **argv = const_cast<const char**>(&_args[0]);

  // This needs to run *before* V8::Initialize(). 
  int exec_argc;
  const char** exec_argv;
  node::Init(&argc, argv, &exec_argc, &exec_argv);

  //node::SetupIsolate();
  Isolate* node_isolate = Isolate::GetCurrent();

  V8::Initialize();
  {
    Locker locker(node_isolate);

    api_bindings_.reset(new ApiBindings());
    RegisterExtension(api_bindings_.get());
    const char* names[] = { "api_bindings.js" };
    v8::ExtensionConfiguration extensions(1, names);
    
    Environment* env =
        node::CreateEnvironment(node_isolate, 
                                argc, argv, 
                                exec_argc, exec_argv,
                                &extensions);
    {
      Context::Scope context_scope(EnvironmentContext(env));

      Thread::Run(message_loop);

      node::EmitExit(env);
      node::RunAtExit(env);
      EnvironmentDispose(env);
      env = NULL;
    }
  }
}

void
NodeThread::CleanUp()
{
  /* Clean up. Not strictly necessary. */
  V8::Dispose();
}


void
NodeThread::RunUvLoop()
{
  /* The simplest and most efficient solution we found is to sleep on the UV */
  /* run loop and immediatly re post the task as soon as the uv_run call     */
  /* returns.                                                                */
  /* The drawback is that the original chromium message loop gets stuck in   */
  /* this call and cannot process incoming messages (wrapper, to/from API).  */
  /* In case the message loop is stuck, we yield the thread to it by calling */
  /* `uv_async_send` with a dummy callback each time we post a message on    */
  /* that thread. Meaning that we must use special interfaces to do so, see  */
  /* `PostTask` here.                                                        */
  /* The alternative were to poll (yuk!) or to reimplement the chromium      */
  /* message loop using libuv. This is by far the less intrusive solution.   */
  /* int ret = */ uv_run(uv_default_loop(), UV_RUN_ONCE);

  message_loop()->PostTask(FROM_HERE,
                           base::Bind(&NodeThread::RunUvLoop,
                                      base::Unretained(this)));

  /* This means that we cannot use PostTaskAndReply from this thread to */
  /* another (since we decided not to touch the message loop). See the  */
  /* wrappers for an example of manual implementation.                  */
}

void 
NodeThread::PostTask(
    const tracked_objects::Location& from_here,
    const base::Closure& task)
{
  this->message_loop_proxy()->PostTask(from_here, task);
  uv_async_send(&uv_dummy);
}

} // namespace exo_browser
