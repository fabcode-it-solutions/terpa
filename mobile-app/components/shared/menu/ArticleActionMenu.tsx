import React, { useCallback, useMemo } from "react";
import ReusableActionMenu, { ActionMenuItem, ActionMenuPosition } from "./ReusableActionMenu";
import { useTheme } from "@/theme";
import { Share } from "react-native";
import crossPlatformAlert from "@/utils/crossPlatformAlert";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";

interface ArticleMenuItem {
  id: string;
  title?: string;
  url?: string;
  favorite?: boolean;
  archived?: boolean;
  toggleFavorite: () => Promise<void> | void;
  toggleArchived: () => Promise<void> | void;
}

interface ArticleActionMenuProps {
  item: ArticleMenuItem;
  position?: ActionMenuPosition;
  visible?: boolean;
  onClose: () => void;
}

/**
 * Article-specific implementation of the ActionMenu
 * This component uses the ReusableActionMenu with pre-configured options for article actions
 */
const ArticleActionMenu: React.FC<ArticleActionMenuProps> = ({
  item,
  position = {},
  visible = false,
  onClose,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const {
    id,
    title: articleTitle,
    url: articleUrl,
    favorite = false,
    archived = false,
    toggleFavorite: toggleFavoriteRequest,
    toggleArchived: toggleArchivedRequest,
  } = item;

  // Open tag editor
  const handleEditTags = useCallback(() => {
    onClose();
    router.push({
      pathname: "/edit-tags" as any, // Route may not exist in current router config
      params: { itemId: id },
    });
  }, [id, onClose, router]);

  // Share article
  const shareArticle = useCallback(async () => {
    try {
      // Close action menu first
      onClose();

      // Prepare share content
      setTimeout(async () => {
        await Share.share({
          message: articleUrl ?? "",
          title: articleTitle ?? "Article",
          url: articleUrl ?? undefined,
        });
      }, 100);
    } catch (error) {
      console.error("Error sharing article:", error);
    }
  }, [articleTitle, articleUrl, onClose]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async () => {
    try {
      await toggleFavoriteRequest();
      onClose();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  }, [onClose, toggleFavoriteRequest]);

  // Toggle archived status
  const toggleArchived = useCallback(async () => {
    try {
      await toggleArchivedRequest();
      onClose();
    } catch (error) {
      console.error("Error toggling archive:", error);
    }
  }, [onClose, toggleArchivedRequest]);

  // Delete article with confirmation
  const confirmDelete = useCallback(() => {
    // Close action menu first
    onClose();

    // Show confirmation alert
    crossPlatformAlert(
      t("menu.deleteConfirmation.title"),
      t("menu.deleteConfirmation.message"),
      [
        {
          text: t("menu.deleteConfirmation.cancel"),
          style: "cancel",
        },
        {
          text: t("menu.deleteConfirmation.confirm"),
          style: "destructive",
          onPress: async () => {
            try {
              // await deleteItem(item);
            } catch (error) {
              console.error("Error deleting item:", error);
            }
          },
        },
      ],
      { cancelable: true },
    );
  }, [onClose, t]);

  // Generate menu items based on the item state
  const menuItems = useMemo<ActionMenuItem[]>(
    () => [
      {
        id: "share",
        label: t("menu.share"),
        icon: "share",
        onPress: shareArticle,
        dividerAfter: true,
      },
      {
        id: "favorite",
        label: favorite ? t("menu.unfavorite") : t("menu.favorite"),
        icon: favorite ? "favorite" : "favorite",
        iconColor: favorite ? theme.colors.favorite : undefined,
        onPress: toggleFavorite,
        dividerAfter: true,
      },
      {
        id: "tag",
        label: t("menu.editTags"),
        icon: "tag",
        onPress: handleEditTags,
        dividerAfter: true,
      },
      {
        id: "archive",
        label: archived ? t("menu.unarchive") : t("menu.archive"),
        icon: "archive",
        onPress: toggleArchived,
        dividerAfter: true,
      },
      {
        id: "delete",
        label: t("menu.delete"),
        icon: "trash",
        destructive: true,
        onPress: confirmDelete,
      },
    ],
    [
      archived,
      favorite,
      handleEditTags,
      shareArticle,
      t,
      theme.colors.favorite,
      toggleArchived,
      toggleFavorite,
      confirmDelete,
    ],
  );

  return (
    <ReusableActionMenu
      visible={visible}
      items={menuItems}
      onClose={onClose}
      position={position}
      width={240}
    />
  );
};

export default ArticleActionMenu;
