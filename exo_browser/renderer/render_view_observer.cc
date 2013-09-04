// Copyright (c) 2013 Stanislas Polu.
// Copyright (c) 2012 The Chromium Authors.
// See the LICENSE file.

#include "exo/exo_browser/renderer/render_view_observer.h"

#include "base/command_line.h"
#include "third_party/WebKit/public/web/WebView.h"
#include "content/public/renderer/render_view.h"
#include "content/public/renderer/render_view_observer.h"
#include "exo/exo_browser/common/switches.h"

using namespace content;

namespace exo_browser {

ExoBrowserRenderViewObserver::ExoBrowserRenderViewObserver(
    RenderView* render_view)
    : RenderViewObserver(render_view) 
{
}

void 
ExoBrowserRenderViewObserver::DidClearWindowObject(WebKit::WebFrame* frame) 
{
  return;
}

}  // namespace exo_browser
