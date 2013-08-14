// Copyright (c) 2013 Stanislas Polu.
// Copyright (c) 2012 The Chromium Authors.
// See the LICENSE file.

#include "breach/browser/breach_browser_application_mac.h"

#include "base/auto_reset.h"
#include "breach/browser/ui/exo_browser.h"
#include "breach/browser/breach_browser_context.h"
#include "breach/browser/breach_content_browser_client.h"
#include "url/gurl.h"

@implementation BrowserCrApplication

- (BOOL)isHandlingSendEvent {
  return handlingSendEvent_;
}

- (void)sendEvent:(NSEvent*)event {
  base::AutoReset<BOOL> scoper(&handlingSendEvent_, YES);
  [super sendEvent:event];
}

- (void)setHandlingSendEvent:(BOOL)handlingSendEvent {
  handlingSendEvent_ = handlingSendEvent;
}

@end
