cask "talentclaw" do
  version :latest
  sha256 :no_check

  url "https://github.com/artemysone/talentclaw/releases/latest/download/TalentClaw-#{version}-arm64.zip"
  name "TalentClaw"
  desc "AI career agent — local-first career hub with Claude-powered assistant"
  homepage "https://talentclaw.sh"

  livecheck do
    url :url
    strategy :github_latest
  end

  auto_updates true
  depends_on macos: ">= :monterey"
  depends_on arch: :arm64

  app "TalentClaw.app"

  zap trash: [
    "~/.talentclaw",
    "~/Library/Application Support/TalentClaw",
    "~/Library/Preferences/com.artemysone.talentclaw.plist",
    "~/Library/Caches/com.artemysone.talentclaw",
  ]
end
