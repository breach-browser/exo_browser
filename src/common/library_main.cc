#include "src/common/library_main.h"

#include "content/public/app/content_main.h"
#include "src/common/main_delegate.h"

int ExoShellMain(int argc, const char* argv[]) {
  exo_shell::MainDelegate delegate;
  content::ContentMainParams params(&delegate);
  params.argc = argc;
  params.argv = argv;
  return content::ContentMain(params);
}
