// Copyright (c) 2013 Stanislas Polu.
// Copyright (c) 2012 The Chromium Authors.
// See the LICENSE file.

#include "breach/browser/devtools/breach_devtools_frontend.h"

#include "base/command_line.h"
#include "base/path_service.h"
#include "content/public/browser/devtools_http_handler.h"
#include "content/public/browser/devtools_manager.h"
#include "content/public/browser/web_contents.h"
#include "content/public/browser/web_contents_view.h"
#include "content/public/common/content_client.h"
#include "breach/common/breach_switches.h"
#include "breach/browser/breach_browser_context.h"
#include "breach/browser/breach_browser_main_parts.h"
#include "breach/browser/breach_content_browser_client.h"
#include "breach/browser/devtools/breach_devtools_delegate.h"
#include "breach/browser/ui/exo_frame.h"
#include "net/base/net_util.h"

using namespace content;

namespace breach {

namespace {

// DevTools frontend path for inspector LayoutTests.
GURL 
GetDevToolsPathAsURL() 
{
  base::FilePath dir_exe;
  if (!PathService::Get(base::DIR_EXE, &dir_exe)) {
    NOTREACHED();
    return GURL();
  }
#if defined(OS_MACOSX)
  // On Mac, the executable is in
  // out/Release/Content Breach.app/Contents/MacOS/Breach.
  // We need to go up 3 directories to get to out/Release.
  dir_exe = dir_exe.AppendASCII("../../..");
#endif
  base::FilePath dev_tools_path = dir_exe.AppendASCII(
      "resources/inspector/devtools.html");
  return net::FilePathToFileURL(dev_tools_path);
}

}  // namespace

// static
BreachDevToolsFrontend* 
BreachDevToolsFrontend::Show(
    WebContents* inspected_contents) {
  /*
  Browser* browser = Browser::CreateNewWindow(
      BreachContentBrowserClient::Get()->browser_context(),
      //inspected_contents->GetBrowserContext(),
      GURL(),
      NULL,
      MSG_ROUTING_NONE,
      gfx::Size());
      */
  /* TODO(spolU): Implement */
  ExoFrame *exo_frame = NULL;
  BreachDevToolsFrontend* devtools_frontend = new BreachDevToolsFrontend(
      exo_frame,
      DevToolsAgentHost::GetOrCreateFor(
        inspected_contents->GetRenderViewHost()).get());

  BreachDevToolsDelegate* delegate = BreachContentBrowserClient::Get()->
    browser_main_parts()->devtools_delegate();
  LOG(INFO) << "DevTools: " 
            << delegate->devtools_http_handler()->GetFrontendURL(NULL);
  //browser->LoadURL(delegate->devtools_http_handler()->GetFrontendURL(NULL));

  return devtools_frontend;
}

void BreachDevToolsFrontend::Focus() {
  web_contents()->GetView()->Focus();
}

void BreachDevToolsFrontend::Close() {
  /* TODO(spolu) Implemebt / Fix */
  //exo_frame_->Kill();
}

BreachDevToolsFrontend::BreachDevToolsFrontend(
    ExoFrame* exo_frame,
    DevToolsAgentHost* agent_host)
/* TODO(spolu): Fix Implement */
  //: WebContentsObserver(exo_frame->web_contents()),
    : exo_frame_(exo_frame),
    agent_host_(agent_host) 
{
  frontend_host_.reset(
      DevToolsClientHost::CreateDevToolsFrontendHost(web_contents(), this));
}

BreachDevToolsFrontend::~BreachDevToolsFrontend() 
{
}

void 
BreachDevToolsFrontend::RenderViewCreated(
    RenderViewHost* render_view_host) 
{
  DevToolsClientHost::SetupDevToolsFrontendClient(
      web_contents()->GetRenderViewHost());
  DevToolsManager* manager = DevToolsManager::GetInstance();
  manager->RegisterDevToolsClientHostFor(agent_host_.get(),
                                         frontend_host_.get());
}

void 
BreachDevToolsFrontend::WebContentsDestroyed(
    WebContents* web_contents) 
{
  DevToolsManager::GetInstance()->ClientHostClosing(frontend_host_.get());
  delete this;
}

void 
BreachDevToolsFrontend::InspectedContentsClosing() 
{
  /* TODO(spolu) Implemebt / Fix */
  //exo_frame_->Kill();
}

}  // namespace content
