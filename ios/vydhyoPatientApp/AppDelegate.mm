#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSURL *jsCodeLocation;

#if DEBUG
  jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif

  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"vydhyoPatientApp"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];

  rootView.backgroundColor = [UIColor whiteColor];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];

  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;

  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];

  return YES;
}

@end