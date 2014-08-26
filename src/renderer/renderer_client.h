// Copyright (c) 2014 Stanislas Polu.
// Copyright (c) 2012 The Chromium Authors.
// See the LICENSE file.

#ifndef EXO_SHELL_RENDERER_CONTENT_RENDERER_CLIENT_H_
#define EXO_SHELL_RENDERER_CONTENT_RENDERER_CLIENT_H_

#include "base/compiler_specific.h"
#include "base/memory/scoped_ptr.h"
#include "base/platform_file.h"
#include "content/public/renderer/content_renderer_client.h"

namespace visitedlink {                                                         
class VisitedLinkSlave;                                                         
}    

namespace blink {
class WebFrame;
class WebPlugin;
struct WebPluginParams;
}

namespace exo_shell {

class ExoShellRenderProcessObserver;

class ExoShellRendererClient : public content::ContentRendererClient {
 public:
  static ExoShellRendererClient* Get();

  ExoShellRendererClient();
  virtual ~ExoShellRendererClient();

  /****************************************************************************/
  /* CONTENTRENDERERCLIENT IMPLEMENTATION */
  /****************************************************************************/
  virtual void RenderThreadStarted() OVERRIDE;
  virtual void RenderViewCreated(content::RenderView* render_view) OVERRIDE;

  virtual bool OverrideCreatePlugin(
      content::RenderFrame* render_frame,
      blink::WebFrame* frame,
      const blink::WebPluginParams& params,
      blink::WebPlugin** plugin) OVERRIDE;

  virtual unsigned long long VisitedLinkHash(const char* canonical_url,         
                                             size_t length) OVERRIDE;           
  virtual bool IsLinkVisited(unsigned long long link_hash) OVERRIDE;   


 private:
  scoped_ptr<ExoShellRenderProcessObserver> observer_;
  scoped_ptr<visitedlink::VisitedLinkSlave> visited_link_slave_;
};

} // namespace exo_shell

#endif // EXO_SHELL_RENDERER_CONTENT_RENDERER_CLIENT_H_
