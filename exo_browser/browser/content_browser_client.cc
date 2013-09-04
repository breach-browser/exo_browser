// Copyright (c) 2013 Stanislas Polu.
// Copyright (c) 2012 The Chromium Authors.
// See the LICENSE file.

#include "exo/exo_browser/browser/content_browser_client.h"

#include "base/command_line.h"
#include "base/file_util.h"
#include "base/path_service.h"
#include "base/strings/string_number_conversions.h"
#include "base/threading/thread_restrictions.h"
#include "base/values.h"
#include "url/gurl.h"
#include "net/url_request/url_request_context_getter.h"
#include "webkit/common/webpreferences.h"
#include "content/public/browser/browser_url_handler.h"
#include "content/public/browser/render_process_host.h"
#include "content/public/browser/render_view_host.h"
#include "content/public/browser/resource_dispatcher_host.h"
#include "content/public/browser/web_contents.h"
#include "content/public/common/content_switches.h"
#include "content/public/common/renderer_preferences.h"
#include "content/public/common/url_constants.h"
#include "exo/exo_browser/browser/browser_main_parts.h"
#include "exo/exo_browser/browser/browser_context.h"
#include "exo/exo_browser/browser/resource_dispatcher_host_delegate.h"
#include "exo/exo_browser/devtools/devtools_delegate.h"
#include "exo/exo_browser/geolocation/access_token_store.h"
#include "exo/exo_browser/common/switches.h"
#include "exo/exo_browser/browser/ui/web_contents_view_delegate_creator.h"


using namespace content;

namespace exo_browser {

namespace {

ExoBrowserContentBrowserClient* g_browser_client;

} // namespace

ExoBrowserContentBrowserClient* 
ExoBrowserContentBrowserClient::Get() 
{
  return g_browser_client;
}

ExoBrowserContentBrowserClient::ExoBrowserContentBrowserClient()
  : browser_main_parts_(NULL)
{
  DCHECK(!g_browser_client);
  g_browser_client = this;
}

ExoBrowserContentBrowserClient::~ExoBrowserContentBrowserClient() 
{
  g_browser_client = NULL;
}

BrowserMainParts* 
ExoBrowserContentBrowserClient::CreateBrowserMainParts(
    const MainFunctionParams& parameters) 
{
  browser_main_parts_ = new ExoBrowserMainParts(parameters);
  return browser_main_parts_;
}

void 
ExoBrowserContentBrowserClient::AppendExtraCommandLineSwitches(
    CommandLine* command_line,
    int child_process_id) 
{
}

void 
ExoBrowserContentBrowserClient::ResourceDispatcherHostCreated() 
{
  resource_dispatcher_host_delegate_.reset(
      new ExoBrowserResourceDispatcherHostDelegate());
  ResourceDispatcherHost::Get()->SetDelegate(
      resource_dispatcher_host_delegate_.get());
}

std::string 
ExoBrowserContentBrowserClient::GetDefaultDownloadName() 
{
  return "download";
}


WebContentsViewDelegate* 
ExoBrowserContentBrowserClient::GetWebContentsViewDelegate(
    WebContents* web_contents) 
{ 
#if !defined(USE_AURA)
  return CreateExoBrowserWebContentsViewDelegate(web_contents);
#else
  return NULL;
#endif
}

void 
ExoBrowserContentBrowserClient::BrowserURLHandlerCreated(
    BrowserURLHandler* handler) 
{
}

ExoBrowserContext* 
ExoBrowserContentBrowserClient::browser_context() 
{
  return browser_main_parts_->browser_context();
}

ExoBrowserContext*
ExoBrowserContentBrowserClient::off_the_record_browser_context() 
{
  return browser_main_parts_->off_the_record_browser_context();
}

AccessTokenStore* 
ExoBrowserContentBrowserClient::CreateAccessTokenStore() 
{
  return new ExoBrowserAccessTokenStore(browser_context());
}

void 
ExoBrowserContentBrowserClient::OverrideWebkitPrefs(
    RenderViewHost* render_view_host,
    const GURL& url,
    WebPreferences* prefs) 
{
  /* TODO(spolu): check */
  // Disable web security.
  //prefs->dom_paste_enabled = true;
  //prefs->javascript_can_access_clipboard = true;
  //prefs->web_security_enabled = true;
  //prefs->allow_file_access_from_file_urls = true;

  // Open experimental features.
  prefs->css_sticky_position_enabled = true;
  prefs->css_shaders_enabled = true;
  prefs->css_variables_enabled = true;

  // Disable plugins and cache by default.
  prefs->plugins_enabled = false;
  prefs->java_enabled = false;
}

net::URLRequestContextGetter* 
ExoBrowserContentBrowserClient::CreateRequestContext(
    BrowserContext* content_browser_context,
    ProtocolHandlerMap* protocol_handlers) 
{
  ExoBrowserContext* browser_context =
      ExoBrowserContextForBrowserContext(content_browser_context);
  return browser_context->CreateRequestContext(protocol_handlers);
}

net::URLRequestContextGetter*
ExoBrowserContentBrowserClient::CreateRequestContextForStoragePartition(
    BrowserContext* content_browser_context,
    const base::FilePath& partition_path,
    bool in_memory,
    ProtocolHandlerMap* protocol_handlers) 
{
  ExoBrowserContext* browser_context =
    ExoBrowserContextForBrowserContext(content_browser_context);
  return browser_context->CreateRequestContextForStoragePartition(
      partition_path, in_memory, protocol_handlers);
}


ExoBrowserContext*
ExoBrowserContentBrowserClient::ExoBrowserContextForBrowserContext(
    BrowserContext* content_browser_context) 
{
  if (content_browser_context == browser_context())
    return browser_context();
  DCHECK_EQ(content_browser_context, off_the_record_browser_context());
  return off_the_record_browser_context();
}

bool 
ExoBrowserContentBrowserClient::IsHandledURL(
    const GURL& url) 
{
  if (!url.is_valid())
    return false;
  DCHECK_EQ(url.scheme(), StringToLowerASCII(url.scheme()));
  // Keep in sync with ProtocolHandlers added by
  // ExoBrowserURLRequestContextGetter::GetURLRequestContext().
  /* TODO(spolu): Check in sync */
  static const char* const kProtocolList[] = {
      chrome::kBlobScheme,
      chrome::kFileSystemScheme,
      chrome::kChromeUIScheme,
      chrome::kChromeDevToolsScheme,
      chrome::kDataScheme,
      chrome::kFileScheme,
  };
  for (size_t i = 0; i < arraysize(kProtocolList); ++i) {
    if (url.scheme() == kProtocolList[i])
      return true;
  }
  return false;
}

void 
ExoBrowserContentBrowserClient::RenderProcessHostCreated(
    content::RenderProcessHost* host) 
{
}

} // namespace exo_browser
