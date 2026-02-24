$(document).ready(function () {
  /* --------------- Materialize initializations --------------- */
  // Filters
  var selectConfig = {
    dropdownOptions: {
      constrainWidth: false,
      coverTrigger: false,
    },
  };
  $("select").formSelect(selectConfig);

  // Home - Intro Slider
  $(".slider").slider({
    indicators: true,
    interval: 4800,
  });

  // Navigation
  $(".sidenav").sidenav();
  $(".scrollspy").scrollSpy({
    scrollOffset: 100,
  });

  $(".sidenav a").on("click", function () {
    var sidenavElement = document.getElementById("mobile-nav");
    var sidenavInstance = M.Sidenav.getInstance(sidenavElement);
    if (sidenavInstance) {
      sidenavInstance.close();
    }
  });

  // Initialize Instructions Carousel
  /*Ingredients carousel*/
  const gap = 16;

  const carousel = document.getElementById("drinksCar"),
    content = document.getElementById("ingredientsContent"),
    next = document.getElementById("next"),
    prev = document.getElementById("prev");

  next.addEventListener("click", (e) => {
    carousel.scrollBy(width + gap, 0);
    if (carousel.scrollWidth !== 0) {
      prev.style.display = "flex";
    }
    if (content.scrollWidth - width - gap <= carousel.scrollLeft + width) {
      next.style.display = "none";
    }
  });
  prev.addEventListener("click", (e) => {
    carousel.scrollBy(-(width + gap), 0);
    if (carousel.scrollLeft - width - gap <= 0) {
      prev.style.display = "none";
    }
    if (!content.scrollWidth - width - gap <= carousel.scrollLeft + width) {
      next.style.display = "flex";
    }
  });

  let width = carousel.offsetWidth;

  window.addEventListener("resize", (e) => (width = carousel.offsetWidth));

  /* ********************* Global Variables ********************** */

  var cocktailName;
  var queryURLs = {
    list: {
      categories: "https://www.thecocktaildb.com/api/json/v1/1/list.php?c=list",
      glasses: "https://www.thecocktaildb.com/api/json/v1/1/list.php?g=list",
      ingredients:
        "https://www.thecocktaildb.com/api/json/v1/1/list.php?i=list",
      cocktails: "https://www.thecocktaildb.com/api/json/v1/1/search.php?f=a",
      alcoholFilter:
        "https://www.thecocktaildb.com/api/json/v1/1/list.php?a=list",
    },
    filter: {
      categoryF: (category) =>
        `https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=${category}`,
      glassF: (glass) =>
        `https://www.thecocktaildb.com/api/json/v1/1/filter.php?g=${glass}`,
      ingredientF: (ingredientName) =>
        `https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=${ingredientName}`,
      alcoholFilter: {
        alcoholic:
          "https://www.thecocktaildb.com/api/json/v1/1/filter.php?a=Alcoholic",
        nonAlcoholic:
          "https://www.thecocktaildb.com/api/json/v1/1/filter.php?a=Non_Alcoholic",
      },
    },
    lookup: {
      ingredientsByIDF: (ingredientID) =>
        `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?iid=${ingredientID}`,
      cocktailDetailsByIDF: (cocktailID) =>
        `https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${cocktailID}`,
      randomCocktail: "https://www.thecocktaildb.com/api/json/v1/1/random.php",
    },
    search: {
      ingredientByNameF: (ingredientName) =>
        `https://www.thecocktaildb.com/api/json/v1/1/search.php?i=${ingredientName}`,
      cocktailByNameF: (cocktailName) =>
        "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=" +
        cocktailName,
    },

    image: {
      ingredientF: (ingredientName) =>
        `https://www.thecocktaildb.com/images/ingredients/${ingredientName}-Medium.png`,
    },
  };
  var numberOfRndSuggestions = 3;

  /* ************************** Functions ************************ */
  /* --------------- Global --------------- */
  function showToast(message) {
    if (window.M && M.toast) {
      M.toast({
        html: message,
        classes: "lime darken-4",
      });
    }
  }

  function setContextNavigationVisible(visible) {
    if (visible) {
      $(".nav-item-context").removeClass("nav-item-hidden");
      return;
    }
    $(".nav-item-context").addClass("nav-item-hidden");
  }

  function setLoading(isLoading) {
    if (isLoading) {
      $("#globalLoader").stop(true, true).fadeIn(120);
      return;
    }
    $("#globalLoader").stop(true, true).fadeOut(120);
  }

  function runAjax(
    name,
    url,
    thenFunction,
    instruc,
    stepsLength,
    failFunction
  ) {
    $.ajax({
      url: url,
      method: "GET",
    })
      .done(function (response) {
        if (thenFunction) {
          thenFunction(name, response, instruc, stepsLength);
        }
      })
      .fail(function (error) {
        if (failFunction) {
          failFunction(name, error, instruc, stepsLength);
        }
      });
  }

  /* --------------- Search --------------- */

  function searchDrink(drink) {
    var sanitizedDrink = (drink || "").trim();
    if (!sanitizedDrink) {
      showToast("Type a drink name first.");
      return;
    }

    setLoading(true);

    // Empty the ingredients carousel
    $("#ingredientsContent").empty();

    // Empty the instructions
    $("#preparationCollap").empty();
    $("#mainImage").empty();
    // Empty the articles
    $("#articlesContent").empty();
    $(".introSlider").hide();
    $(".drinkIngredSection").show();
    $("#carouselBody").show();
    $(".preparationSection").show();
    $(".articlesSection").show();
    $("#ingredientsContent").show();

    runAjax(
      "drinkSearch",
      queryURLs.search.cocktailByNameF(sanitizedDrink),
      uploadSearch,
      null,
      null,
      function () {
        setLoading(false);
        showToast("Could not load that drink. Please try again.");
      }
    );
  }

  $("#searchForm").on("submit", function (event) {
    event.preventDefault();
    cocktailName = ($("#drinkInput").val() || "").trim();
    searchDrink(cocktailName);
  });

  /* --------------- Filter --------------- */
  $("select.categoryFilter").change(function () {
    runUploadSuggested();
    var selectCat = ($(this).children("option:selected").val() || "").trim();
    if (selectCat.toLowerCase() === "main" || selectCat === "") {
      return;
    }

    runAjax("drinkSearch", queryURLs.filter.categoryF(selectCat), getDrinkName);
    $(this).formSelect(selectConfig);
    $(this).children("option[value=main]").attr("selected", "");
  });

  $("select.ingredientFilter").change(function () {
    runUploadSuggested();
    var selectIng = ($(this).children("option:selected").val() || "").trim();
    if (selectIng === "") {
      return;
    }

    runAjax("drinkSearch", queryURLs.filter.ingredientF(selectIng), getDrinkName);
  });

  $("select.glassFilter").change(function () {
    runUploadSuggested();
    var selectGlass = ($(this).children("option:selected").val() || "").trim();
    if (
      selectGlass === "" ||
      selectGlass.toLowerCase() === "main" ||
      selectGlass.toLowerCase() === "glass type"
    ) {
      return;
    }

    runAjax("drinkSearch", queryURLs.filter.glassF(selectGlass), getDrinkName);
  });

  function getDrinkName(name, resp) {
    if (!resp || !resp.drinks || resp.drinks.length === 0) {
      showToast("No drinks found for that filter.");
      return;
    }

    cocktailName =
      resp.drinks[Math.floor(Math.random() * resp.drinks.length)].strDrink;
    searchDrink(cocktailName);
  }
  /* --------------- Drink ---------------- */
  // upload search results
  function uploadSearch(name, resp) {
    if (!resp || !resp.drinks || resp.drinks.length === 0) {
      setLoading(false);
      showToast("No drink found with that name.");
      return;
    }

    resp = resp.drinks[0];
    $("#drinkNameH4").text(resp.strDrink);

    var mainImageJumbo = $("#mainImage");
    var mainImg = $("<img>");
    mainImg.attr("src", resp.strDrinkThumb);
    mainImg.addClass("centerImg");
    mainImageJumbo.append(mainImg);
    mainImageJumbo.addClass("col s12 m6 offset-m3 l6 offset-l3");

    setContextNavigationVisible(true);
    ingredients(resp);
    instructionsSteps(resp.strInstructions, resp);
    getArticles(resp.strDrink);
    setLoading(false);
  }

  /* --------------- Ingredients ---------------- */
  function getDrinkIngredients(resp) {
    var ingrArray = [];

    Object.entries(resp).forEach(function (entry) {
      let subKey = entry[0].substring(0, 13);
      if (subKey === "strIngredient" && entry[1] != null) {
        ingrArray.push(entry[1]);
      }
    });

    return ingrArray;
  }

  function ingredients(resp) {
    $("#ingredientsList").empty();

    // Get the ingredients list
    var ingrArray = getDrinkIngredients(resp);

    for (let j = 0; j < ingrArray.length; j++) {
      // Display ingredients list
      var ingredText = $("<p>");
      ingredText.attr("class", "ingredSpan");
      ingredText.text(ingrArray[j]);

      // Area for ingredients image and text
      var ingredDiv = $("<div>");

      // Display ingredients images
      var ingredient = ingrArray[j].replace(" ", "%20");
      var imageUrl =
        "https://www.thecocktaildb.com/images/ingredients/" +
        ingredient +
        "-Medium.png";
      var ingredImg = $("<img>");
      ingredImg.attr("class", "item");
      ingredImg.attr("src", imageUrl);
      ingredDiv.append(ingredImg);
      ingredDiv.append(ingredText);
      $("#ingredientsContent").append(ingredDiv);
    }
  }

  function getIngredientImage(name, resp) {}

  /* --------------- Preparation --------------- */
<<<<<<< HEAD:front.js
  // Giphy API Key: GIPHY_API_KEY_REDACTED
  // Another Giphy API Key: kYlC1mU6XZtCjjMbaFOQr4Y52hj0VQYx

  var giphyAPIKey = "GIPHY_API_KEY_REDACTED";
=======
>>>>>>> f7b474b (Express added to safely manage secret keys +  Updated README):public/front.js
  function normalizeText(text) {
    return (text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function makegiphyURL(query) {
    return "/api/giphy/search?query=" + encodeURIComponent(query);
  }

  function matchesIngredientInStep(stepText, ingredientName) {
    var normalizedStep = normalizeText(stepText);
    var normalizedIngredient = normalizeText(ingredientName);

    if (normalizedStep.indexOf(normalizedIngredient) >= 0) {
      return true;
    }

    var ingredientTokens = normalizedIngredient
      .split(/[^a-z0-9]+/)
      .filter(function (token) {
        return token.length >= 4;
      });

    for (let i = 0; i < ingredientTokens.length; i++) {
      if (normalizedStep.indexOf(ingredientTokens[i]) >= 0) {
        return true;
      }
    }

    return false;
  }

  function getInstructionIngredients(instruction, drinkIngredients) {
    var stepIngredients = [];

    for (let i = 0; i < drinkIngredients.length; i++) {
      if (matchesIngredientInStep(instruction, drinkIngredients[i])) {
        stepIngredients.push(drinkIngredients[i]);
      }
    }

    return stepIngredients.slice(0, 2);
  }

  function buildGifQueryFallbacks(verb, stepIngredients, drinkInfo) {
    var queries = [];
    var ingredientContext = stepIngredients.join(" ").trim();
    var glassContext = (drinkInfo && drinkInfo.strGlass) || "";
    var categoryContext = (drinkInfo && drinkInfo.strCategory) || "";

    if (ingredientContext !== "") {
      queries.push(verb + " " + ingredientContext + " cocktail");
      if (glassContext !== "") {
        queries.push(verb + " " + ingredientContext + " " + glassContext);
      }
      if (categoryContext !== "") {
        queries.push(verb + " " + ingredientContext + " " + categoryContext);
      }
    }

    if (glassContext !== "") {
      queries.push(verb + " " + glassContext + " cocktail");
    }
    if (categoryContext !== "") {
      queries.push(verb + " " + categoryContext + " cocktail");
    }

    queries.push(verb + " cocktail");
    queries.push(verb);

    var uniqueQueries = [];
    for (let i = 0; i < queries.length; i++) {
      var query = queries[i].replace(/\s+/g, " ").trim();
      if (query !== "" && uniqueQueries.indexOf(query) === -1) {
        uniqueQueries.push(query);
      }
    }

    return uniqueQueries;
  }

  function getBestGifURL(resp, verb, stepIngredients) {
    if (!resp || !resp.data || resp.data.length === 0) {
      return "";
    }

    var bestURL = "";
    var bestScore = -1;
    var normalizedVerb = normalizeText(verb);
    var ingredientTokens = [];

    stepIngredients.forEach(function (ingredient) {
      normalizeText(ingredient)
        .split(/[^a-z0-9]+/)
        .forEach(function (token) {
          if (token.length >= 4) {
            ingredientTokens.push(token);
          }
        });
    });

    for (let i = 0; i < resp.data.length; i++) {
      var gif = resp.data[i];
      var gifURL =
        gif &&
        gif.images &&
        gif.images.fixed_height &&
        gif.images.fixed_height.url;
      if (!gifURL) {
        continue;
      }

      var gifText = normalizeText(
        (gif.title || "") + " " + (gif.slug || "") + " " + (gif.alt_text || "")
      );

      var score = 0;
      if (gifText.indexOf(normalizedVerb) >= 0) {
        score += 4;
      }
      if (gifText.indexOf("cocktail") >= 0 || gifText.indexOf("drink") >= 0) {
        score += 2;
      }

      for (let j = 0; j < ingredientTokens.length; j++) {
        if (gifText.indexOf(ingredientTokens[j]) >= 0) {
          score += 2;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestURL = gifURL;
      }
    }

    return bestURL;
  }

  function fetchStepGif(queries, targetImage, verb, stepIngredients, queryIndex) {
    if (!targetImage || !queries || queryIndex >= queries.length) {
      return;
    }

    var giphyURL = makegiphyURL(queries[queryIndex]);
    runAjax(
      "stepGif",
      giphyURL,
      function (name, resp) {
        var gifURL = getBestGifURL(resp, verb, stepIngredients);
        if (gifURL !== "") {
          targetImage.attr("src", gifURL);
          targetImage.show();
          return;
        }

        fetchStepGif(queries, targetImage, verb, stepIngredients, queryIndex + 1);
      },
      null,
      null,
      function () {
        fetchStepGif(queries, targetImage, verb, stepIngredients, queryIndex + 1);
      }
    );
  }

  function addPreparationStep(stepNumber, instruction) {
    var prepCollapsibleSection = $("#preparationCollap");
    var prepStep = $("<li>");
    var prepStepHead = $("<div>");
    var prepStepBody = $("<div>");
    var itemSpan = $("<div>");
    var stepImg = $("<img>");

    prepStepHead.addClass("collapsible-header prepStep");
    prepStepBody.addClass("collapsible-body");
    prepStepBody.attr("style", "text-align:center");
    prepStepHead.text("Step " + stepNumber);
    itemSpan.text(instruction);

    stepImg.addClass("item");
    stepImg.hide();

    prepStepBody.append(itemSpan);
    prepStepBody.append(stepImg);
    prepStep.append(prepStepHead);
    prepStep.append(prepStepBody);
    prepCollapsibleSection.append(prepStep);

    return stepImg;
  }

  function instructionsSteps(instructions, drinkInfo) {
    var instSteps = instructions || "";
    var steps = [];
    var step = "";
    var drinkIngredients = drinkInfo ? getDrinkIngredients(drinkInfo) : [];

    for (let i = 0; i < instSteps.length; i++) {
      if (
        instSteps[i] == "." &&
        instSteps[i - 1] != "z" &&
        instSteps[i - 2] != "o"
      ) {
        if (step.trim().length > 0) {
          steps.push(step.trim());
        }
        step = "";
        i++;
      } else {
        step = step + instSteps[i];
      }
    }
    if (step.trim().length > 0) {
      steps.push(step.trim());
    }

    // getting action verbs from the intructions
    var verbs = [
      "fill",
      "place",
      "saturate",
      "add",
      "dash",
      "pour",
      "mix",
      "shake",
      "rub",
      "sprinkle",
      "serve",
      "garnish",
      "blender",
      "muddle",
      "mash",
      "combine",
      "float",
      "look",
      "simmer",
      "age",
      "strain",
      "dissolve",
      "stir",
      "dry",
      "boil",
      "eat",
      "squeeze",
      "substituted",
      "use",
      "blend",
      "drink",
      "build",
      "cream",
      "served",
    ];

    for (let j = 0; j < steps.length; j++) {
      var temp = steps[j].toLowerCase();
      var instruction = steps[j];
      var stepImage = addPreparationStep(j + 1, instruction);
      var stepIngredients = getInstructionIngredients(
        instruction,
        drinkIngredients
      );
      var matchedVerb = "";

      for (let i = 0; i < verbs.length; i++) {
        if (temp.search(verbs[i]) >= 0) {
          matchedVerb = verbs[i];
          break;
        }
      }

      if (matchedVerb !== "") {
        var gifQueries = buildGifQueryFallbacks(
          matchedVerb,
          stepIngredients,
          drinkInfo
        );
        fetchStepGif(gifQueries, stepImage, matchedVerb, stepIngredients, 0);
      }
    }

    var elem = document.querySelector(".collapsible");
    if (elem) {
      var instance = M.Collapsible.init(elem, {
        accordion: false,
      });
      if (steps.length > 0) {
        instance.open(0);
      }
    }
  }

  /* -------------- Articles ------------- */
  function renderArticlesNotice(message) {
    var articlesContent = $("#articlesContent");
    if (!articlesContent.length) {
      return;
    }

    var colDiv = $("<div>");
    var panelDiv = $("<div>");

    colDiv.attr("class", "col s12");
    panelDiv.attr("class", "card-panel");
    panelDiv.text(message);

    colDiv.append(panelDiv);
    articlesContent.append(colDiv);
  }

  function getArticles(drink) {
<<<<<<< HEAD:front.js
    var nytApiKey = "NYT_API_KEY_REDACTED";
    var search = drink + "%20cocktail";
    search = search.replace(" ", "%20");
    var queryNYTUrl = `https://api.nytimes.com/svc/search/v2/articlesearch.json?q=${search}&api-key=${nytApiKey}`;
    runAjax("articlesContent", queryNYTUrl, displayArticles);
=======
    var queryNYTUrl = "/api/nyt/articles?drink=" + encodeURIComponent(drink);
    runAjax("articlesContent", queryNYTUrl, displayArticles, null, null, function () {
      renderArticlesNotice(
        "Article suggestions are unavailable right now."
      );
    });
>>>>>>> f7b474b (Express added to safely manage secret keys +  Updated README):public/front.js
  }

  function displayArticles(name, resp) {
    if (!resp || !resp.response || !resp.response.docs) {
      return;
    }

    respArray = resp.response.docs;
    var contaArt = 0;

    respArray.forEach(function (article) {
      if (contaArt < 3) {
        // Create the articles' elements
        var colDiv = $("<div>");
        var cardDiv = $("<div>");
        var cardImageDiv = $("<div>");

        var span = $("<span>");
        var cardContentDiv = $("<div>");
        var p = $("<p>");
        var cardActionDiv = $("<div>");
        var a = $("<a>");

        colDiv.attr("class", "col s12 m4 l4");
        cardDiv.addClass("card cardhgt");
        cardImageDiv.attr("class", "card-image");
        if (article.multimedia.length > 0) {
          var image = $("<img>");
          image.attr(
            "src",
            "https://www.nytimes.com/" + article.multimedia[0].url
          );
          image.attr("class", "img-hgt");
          cardImageDiv.append(image);
        } else {
          var image = $("<img>");
          image.attr("src", "./nylogo.jpg");
          image.attr("class", "img-hgt");
          cardImageDiv.append(image);
        }

        span.attr("class", "card-title lime darken-4 truncate");
        span.text(article.headline.main);
        cardContentDiv.attr("class", "card-content");
        if (article.snippet == null || article.snippet == "") {
          p.text(" ");
          var br;
          br = $("<br>");
          p.append(br);
        } else {
          p.text(article.snippet);
        }
        p.attr("class", "truncate pmar");
        cardActionDiv.attr("class", "card-action");
        a.attr("href", article.web_url);
        a.attr("target", "_blank");
        a.text("Read article");

        cardImageDiv.append(span);
        cardContentDiv.append(p);
        cardActionDiv.append(a);
        cardDiv.append(cardImageDiv);
        cardDiv.append(cardContentDiv);
        cardDiv.append(cardActionDiv);
        colDiv.append(cardDiv);
        $("#articlesContent").append(colDiv);
      }

      contaArt++;
    });
  }

  /* -------------- Suggested ------------- */
  // Query Random Cocktail
  function runUploadSuggested() {
    // Empty suggested drinks
    $(".randomSuggest").empty();

    // Trigger new ones
    for (let i = 0; i < numberOfRndSuggestions; i++) {
      runAjax(
        "randomSuggest",
        queryURLs.lookup.randomCocktail,
        uploadSuggested
      );
    }
  }

  function uploadSuggested(name, res) {
    if (!res || !res.drinks || res.drinks.length === 0) {
      return;
    }

    res = res.drinks[0];
    var colDiv = $("<div>");
    var cardDiv = $("<div>");
    var cardImgDiv = $("<div>");
    var imgTag = $("<img>");
    var spanTag = $("<span>");
    var actionDiv = $("<div>");
    var aTag = $("<a>");

    colDiv.attr("class", "col s12 m4 l4");
    cardDiv.attr("class", "card");
    cardImgDiv.attr("class", "card-image");
    imgTag.attr("src", res.strDrinkThumb);
    imgTag.attr("class", "img-hgt");
    spanTag.attr("class", "card-title lime darken-4");
    spanTag.text(res.strDrink);
    actionDiv.attr("class", "card-action");
    aTag.attr("href", "#");
    aTag.attr("drink", res.strDrink);
    aTag.text("View recipe");

    cardImgDiv.append(imgTag);
    cardImgDiv.append(spanTag);
    cardDiv.append(cardImgDiv);
    actionDiv.append(aTag);
    cardDiv.append(actionDiv);
    colDiv.append(cardDiv);
    $(`.${name}`).append(colDiv);
  }

  // Suggested Drink selection
  $(".randomSuggest").on("click", function (event) {
    var selectedDrinkLink = event.target.closest("a[drink]");
    if (!selectedDrinkLink) {
      return;
    }

    event.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    cocktailName = selectedDrinkLink.getAttribute("drink");
    if (cocktailName != undefined) {
      localStorage.setItem("last", cocktailName);
      searchDrink(cocktailName);
    }
  });

  function toggleScrollTopButton() {
    if ($(window).scrollTop() > 320) {
      $("#scrollTopBtn").addClass("is-visible");
      return;
    }
    $("#scrollTopBtn").removeClass("is-visible");
  }

  $("#scrollTopBtn").on("click", function (event) {
    event.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  /* ********************** Event Listeners ********************** */
  runUploadSuggested();
  setLoading(false);
  setContextNavigationVisible(false);
  $(".drinkIngredSection").hide();
  $("#carouselBody").hide();
  $(".preparationSection").hide();
  $(".articlesSection").hide();
  $("#ingredientsContent").hide();
  toggleScrollTopButton();
  $(window).on("scroll", toggleScrollTopButton);
});
